// pusher.js — Apify FB Groups → Groq classify+draft → Telegram DM
// Mounted at /api/pusher-* routes in worker.js
//
// Bindings used (set via wrangler secret / wrangler.toml):
//   env.APIFY_TOKEN              (existing)
//   env.GROQ_API_KEY             (existing)
//   env.BQ_USERS                 (existing KV — uses prefix "pusher:")
//   env.TELEGRAM_BOT_TOKEN       NEW SECRET
//   env.APIFY_WEBHOOK_SECRET     NEW SECRET (random hex; also set on Apify webhook)
//   env.MOSHE_CHAT_ID            NEW VAR (default 369310707)
//   env.PUSHER_GROQ_MODEL        optional; defaults to llama-3.3-70b-versatile
//   env.PUSHER_URGENCY_THRESHOLD optional; defaults to "3"

const URGENCY_DEFAULT = 3;
const ALERT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

const NICHE_CONFIG = {
  "ai-video-la": {
    classifier: AI_VIDEO_LA_CLASSIFIER(),
    drafter: AI_VIDEO_LA_DRAFTER(),
    keywords: AI_VIDEO_LA_KEYWORDS(),
  },
};

export async function handlePusherHealth(request, env) {
  return json({
    ok: true,
    ts: new Date().toISOString(),
    niches: Object.keys(NICHE_CONFIG),
    has_groq: !!env.GROQ_API_KEY,
    has_apify: !!env.APIFY_TOKEN,
    has_telegram: !!env.TELEGRAM_BOT_TOKEN,
    has_secret: !!env.APIFY_WEBHOOK_SECRET,
  });
}

export async function handlePusherWebhook(request, env, ctx) {
  const incomingSecret = request.headers.get("X-Pusher-Secret");
  if (!env.APIFY_WEBHOOK_SECRET || incomingSecret !== env.APIFY_WEBHOOK_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const eventType = payload.eventType || "";
  if (eventType !== "ACTOR.RUN.SUCCEEDED") {
    return json({ ignored: true, eventType });
  }
  const runId = payload.eventData?.actorRunId;
  if (!runId) return json({ error: "no actorRunId" }, 400);

  const niche = payload.customData?.niche || "ai-video-la";
  if (!NICHE_CONFIG[niche]) return json({ error: `unknown niche: ${niche}` }, 400);

  // Return fast (Apify webhook needs <30s response); fetch datasetId + process async.
  if (ctx && typeof ctx.waitUntil === "function") {
    ctx.waitUntil(resolveAndProcess(runId, niche, env));
  } else {
    await resolveAndProcess(runId, niche, env);
  }
  return json({ ok: true, queued: true, runId, niche });
}

async function resolveAndProcess(runId, niche, env) {
  // Apify webhook eventData only has actorRunId, not datasetId. Fetch run to get it.
  const r = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
    headers: { Authorization: `Bearer ${env.APIFY_TOKEN}` },
  });
  if (!r.ok) {
    console.error(`[pusher] run fetch ${r.status}`);
    return;
  }
  const run = (await r.json()).data;
  const datasetId = run.defaultDatasetId;
  if (!datasetId) {
    console.error("[pusher] run has no defaultDatasetId");
    return;
  }
  await processDataset(datasetId, niche, runId, env);
}

async function processDataset(datasetId, niche, runId, env) {
  const cfg = NICHE_CONFIG[niche];
  const threshold = parseInt(env.PUSHER_URGENCY_THRESHOLD || String(URGENCY_DEFAULT), 10);
  const maxLLMPerRun = parseInt(env.PUSHER_MAX_LLM_PER_RUN || "30", 10);

  const items = await fetchDataset(datasetId, env.APIFY_TOKEN);
  const results = { total: items.length, prefiltered: 0, classified: 0, alerts: 0, errors: 0, capped: false };

  for (const raw of items) {
    if (results.classified >= maxLLMPerRun) { results.capped = true; break; }
    const post = normalizePost(raw);
    if (!post.body) continue;
    if (!keywordPreFilter(post.body, cfg.keywords)) continue;
    results.prefiltered++;

    let verdict;
    try {
      verdict = await groqJson(cfg.classifier, classifyUserMsg(post), env, 400);
      results.classified++;
    } catch (e) {
      console.error("[pusher classify]", e.message);
      results.errors++;
      continue;
    }

    if (!verdict.is_buyer_intent || (verdict.urgency || 0) < threshold) continue;

    let draft;
    try {
      draft = await groqJson(cfg.drafter, draftUserMsg(post, verdict), env, 600);
    } catch (e) {
      console.error("[pusher draft]", e.message);
      results.errors++;
      continue;
    }
    if (!draft.reply || (draft.confidence || 0) < 3) continue;

    await sendTelegramAlert(post, verdict, draft, env);
    await logAlert(post, verdict, draft, niche, env);
    results.alerts++;
  }

  // Log run summary to KV for /pusher-stats
  await env.BQ_USERS.put(
    `pusher:run:${runId}`,
    JSON.stringify({ ts: new Date().toISOString(), niche, runId, ...results }),
    { expirationTtl: ALERT_TTL_SECONDS }
  );
  console.log("[pusher run done]", JSON.stringify(results));
}

export async function handlePusherBetaSeats(request, env) {
  const seatRaw = await env.BQ_USERS.get("pusher:beta_seats");
  const used = seatRaw ? parseInt(seatRaw, 10) : 0;
  const cap = parseInt(env.PUSHER_BETA_CAP || "10", 10);
  return json({ used, cap, remaining: Math.max(0, cap - used) });
}

function _checkAdminPass(url, env) {
  const pw = url.searchParams.get("password") || "";
  return env.ADMIN_PASSWORD && pw === env.ADMIN_PASSWORD;
}

export async function handlePusherAdminList(request, env) {
  const url = new URL(request.url);
  if (!_checkAdminPass(url, env)) return json({ error: "unauthorized" }, 401);
  const list = await env.BQ_USERS.list({ prefix: "pusher:beta:", limit: 200 });
  const users = [];
  for (const k of list.keys) {
    const raw = await env.BQ_USERS.get(k.name);
    if (raw) users.push(JSON.parse(raw));
  }
  users.sort((a, b) => (a.ts < b.ts ? 1 : -1));
  return json({ users, count: users.length });
}

export async function handlePusherAdminRunNow(request, env) {
  const url = new URL(request.url);
  if (!_checkAdminPass(url, env)) return json({ error: "unauthorized" }, 401);
  const ACTOR_ID = "TbRkI5wBA2Hs4yiEI";
  const niche = url.searchParams.get("niche") || "ai-video-la";
  const startResp = await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/runs?build=latest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.APIFY_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),  // uses saved input from console
  });
  if (!startResp.ok) {
    const txt = (await startResp.text()).slice(0, 300);
    return json({ error: `apify start ${startResp.status} ${txt}` }, 502);
  }
  const data = await startResp.json();
  const runId = data?.data?.id;
  return json({ ok: true, runId, niche });
}

export async function handlePusherStats(request, env) {
  const list = await env.BQ_USERS.list({ prefix: "pusher:alert:", limit: 100 });
  const alerts = [];
  for (const k of list.keys.slice(-50)) {
    const raw = await env.BQ_USERS.get(k.name);
    if (raw) alerts.push(JSON.parse(raw));
  }
  alerts.sort((a, b) => (a.ts < b.ts ? 1 : -1));
  return json({
    count: alerts.length,
    most_recent_ts: alerts[0]?.ts || null,
    last_20: alerts.slice(0, 20).map((a) => ({
      ts: a.ts,
      niche: a.niche,
      urgency: a.verdict?.urgency,
      lang: a.verdict?.language,
      author: a.post?.author,
      group: a.post?.group,
      body_preview: (a.post?.body || "").slice(0, 120),
      draft: a.draft?.reply,
      url: a.post?.url,
    })),
  });
}

// ---------- helpers ----------

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function normalizePost(raw) {
  return {
    url: raw.url || raw.postUrl || "",
    author: (raw.author && raw.author.name) || raw.authorName || "unknown",
    group: (raw.group && raw.group.name) || raw.groupName || "unknown",
    body: raw.text || raw.postText || raw.body || "",
    top_comments: raw.topComments || raw.comments || [],
  };
}

function keywordPreFilter(body, kw) {
  const haystack = body.toLowerCase();
  for (const neg of kw.negative_keywords || []) {
    if (haystack.includes(neg.toLowerCase())) return false;
  }
  const all = [
    ...(kw.buyer_intent_strong || []),
    ...(kw.buyer_intent_medium || []),
    ...(kw.service_keywords || []),
  ];
  return all.some((k) => haystack.includes(k.toLowerCase()));
}

async function fetchDataset(datasetId, token) {
  const r = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`dataset fetch ${r.status}`);
  const data = await r.json();
  return Array.isArray(data) ? data : data.data || [];
}

function classifyUserMsg(post) {
  return `<post>${truncate(post.body, 2000)}</post>
<author>${post.author}</author>
<group>${post.group}</group>
<top_comments>${truncate(JSON.stringify(post.top_comments), 1500)}</top_comments>`;
}

function draftUserMsg(post, verdict) {
  return `<post>${truncate(post.body, 2000)}</post>
<author>${post.author}</author>
<group>${post.group}</group>
<top_comments>${truncate(JSON.stringify(post.top_comments), 1500)}</top_comments>
<classification>${JSON.stringify(verdict)}</classification>
<faq>${AI_VIDEO_LA_FAQ()}</faq>
<voice>${AI_VIDEO_LA_VOICE()}</voice>
<language>${verdict.language || "en"}</language>`;
}

function truncate(s, n) {
  return (s || "").slice(0, n);
}

async function groqJson(system, user, env, maxTokens) {
  const model = env.PUSHER_GROQ_MODEL || "llama-3.3-70b-versatile";
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!r.ok) throw new Error(`groq ${r.status} ${(await r.text()).slice(0, 200)}`);
  const data = await r.json();
  return JSON.parse(data.choices[0].message.content);
}

async function sendTelegramAlert(post, verdict, draft, env) {
  const chatId = env.MOSHE_CHAT_ID || "369310707";
  const lang = (verdict.language || "en").toUpperCase();
  const fire = "🔥".repeat(Math.max(1, Math.min(5, verdict.urgency || 3)));
  const text = `🎯 *Pusher alert* ${fire}
*${post.author}* @ ${post.group}
${lang} · ${verdict.category} · urgency ${verdict.urgency}

_Post:_
${truncate(post.body, 500)}

🔗 ${post.url}

_Draft (${draft.char_count}ch, conf ${draft.confidence}):_
\`\`\`
${draft.reply}
\`\`\`

_Reasoning:_ ${verdict.reasoning}`;

  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: false,
    }),
  });
  if (!r.ok) console.error(`tg fail ${r.status} ${(await r.text()).slice(0, 200)}`);
}

async function logAlert(post, verdict, draft, niche, env) {
  const ts = new Date().toISOString();
  const id = ts.replace(/[^0-9]/g, "").slice(0, 17);
  await env.BQ_USERS.put(
    `pusher:alert:${id}`,
    JSON.stringify({ ts, niche, post, verdict, draft }),
    { expirationTtl: ALERT_TTL_SECONDS }
  );
}

// ---------- inlined niche assets ----------
// Edit + redeploy. Keeping as functions so the file can be tree-shaken if mounted lazily.

function AI_VIDEO_LA_KEYWORDS() {
  return {
    buyer_intent_strong: [
      "looking for a videographer", "need a video", "marketing video", "promo video",
      "before and after video", "reel for my business", "social media for contractors",
      "instagram for my construction", "instagram for my remodeling",
      "anyone do videos for contractors", "video editor recommendation",
      "content creator for", "ai video",
      "מחפש צלם", "מחפש עורך וידאו", "צריך וידאו", "סרטון פרסומת",
      "מישהו מצלם קבלנים", "תוכן לקבלן", "סרטוני לפני ואחרי",
      "אינסטגרם לעסק", "מצלם מקצועי", "בונה לי תוכן", "סרטונים לעסק",
    ],
    buyer_intent_medium: [
      "growing my instagram", "no time for content", "social media is hard",
      "need more clients", "marketing for my business", "branding for contractors",
      "construction marketing", "remodel marketing", "real estate marketing",
      "פרסום לעסק", "מיתוג לעסק", "אין לי זמן לתוכן", "אינסטגרם של העסק",
      "צריך עוד לקוחות", "שיווק לקבלן", "שיווק לשיפוצים",
    ],
    service_keywords: [
      "construction", "remodel", "remodeling", "renovation", "general contractor",
      "kitchen contractor", "bathroom contractor", "deck", "patio", "ADU",
      "real estate agent", "realtor", "interior design",
      "קבלן", "שיפוצים", "שיפוץ", "מטבח", "אמבטיה", "פרגולה", "תוספת בנייה",
      "מתווך", "נדל״ן", "עיצוב פנים",
    ],
    negative_keywords: [
      "free", "looking for free", "barter", "trade work", "internship",
      "volunteer", "no budget",
    ],
  };
}

function AI_VIDEO_LA_CLASSIFIER() {
  return `You are a buyer-intent classifier for BQ Production AI video service for LA contractors.
Output strict JSON only. Schema:
{"is_buyer_intent": bool, "niche_tag": "ai-video-la"|"other", "urgency": 0-5, "language": "he"|"en"|"mixed"|"other", "category": "asking-for-recommendation"|"complaining-about-marketing"|"showing-pain"|"competitor-pitch"|"irrelevant", "key_signals": [...], "reasoning": "1-2 sentences"}

Urgency: 5=direct ask, 4=recommendation request, 3=pain post, 2=tangential, 1=industry-relevant no buy signal, 0=irrelevant.
Set is_buyer_intent=true ONLY if urgency>=3 AND niche_tag is "ai-video-la".
Niche fit: LA-area construction, remodeling, real estate agents, interior designers, Israeli LA small biz. NOT: free/barter, recruiters, job seekers, e-commerce.
Match language: he | en | mixed.`;
}

function AI_VIDEO_LA_DRAFTER() {
  return `You draft Hebrew/English Facebook comment-replies for BQ Production. 4-part structure: validation → insight → value → soft CTA. Match post language exactly.

Hard rules:
- Hebrew cap 400 chars / English 600 chars.
- No emojis (max one 🤝 or 👌).
- No multi-paragraph.
- Reference one specific detail from the post.
- One CTA max (or none). Soft CTA only — never "DM me" or "let's hop on a call". Use bqprod.pages.dev or a soft DM invite.
- No price unless OP asked.
- Avoid AI tells: "great question", "happy to help", "absolutely", "feel free to DM".
- Anchor in FAQ + voice. Sherman Oaks kitchen remodeler (Josh Blum) is the go-to client anchor.
- If can't draft something specific (post too vague, confidence<3) — return empty reply with warning.

Output strict JSON: {"reply": "...", "language": "he|en|mixed", "char_count": int, "structure_used": [...], "cta_type": "url|dm-invite|phone|none", "anchor_client": "...", "confidence": 0-5, "warnings": [...]}`;
}

function AI_VIDEO_LA_FAQ() {
  return `BQ Production: AI-generated cinematic vertical video for LA service businesses. ARRI/anamorphic look, 9:16 native, 16 videos/month managed service. Active client: Josh Blum / Gold Remodeling Sherman Oaks $2,700/mo. New clients $750/video; 8-pack from $5,000. No free samples. Pico-Robertson based, Hebrew + English. Site bqprod.pages.dev. Phone +1 (747) 267-9912. Don't do live shoots, photography, logos, edit-only, or freebies.`;
}

function AI_VIDEO_LA_VOICE() {
  return `Moshe voice: direct, short fragments OK, no hype, specific over vague. NO: "great question", "happy to help", "absolutely", emojis. YES: "I work with...", "Sherman Oaks remodeler I work with...", "the trick is...", "different angle: ...". Hebrew 200-400 chars. English 250-500 chars. Last line = soft CTA (URL bqprod.pages.dev OR soft DM invite OR nothing). Never multi-paragraph. Sound like Moshe wrote it tired and direct.`;
}
