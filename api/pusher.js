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

// Default niche bundle (Moshe's own pipeline). User-specific configs override at runtime.
const NICHE_CONFIG = {
  "ai-video-la": {
    classifier: AI_VIDEO_LA_CLASSIFIER(),
    drafter: AI_VIDEO_LA_DRAFTER(),
    keywords: AI_VIDEO_LA_KEYWORDS(),
    faq: AI_VIDEO_LA_FAQ(),
    voice: AI_VIDEO_LA_VOICE(),
    business_name: "BQ Production",
    chat_id: "369310707", // Moshe
  },
};

// Resolve runtime config: prefer per-user record from KV; fall back to default niche.
async function resolveConfig(payload, env) {
  // 1. If customData.user provided, look up user-specific config
  const userEmail = payload.customData?.user || payload.customData?.userEmail;
  if (userEmail) {
    const raw = await env.BQ_USERS.get(`pusher:user:${userEmail.toLowerCase()}`);
    if (raw) {
      const userCfg = JSON.parse(raw);
      if (userCfg.status === "active" && userCfg.chat_id) {
        return {
          tenant: userEmail.toLowerCase(),
          isUser: true,
          classifier: buildClassifierPrompt(userCfg),
          drafter: buildDrafterPrompt(userCfg),
          keywords: userCfg.keywords || NICHE_CONFIG["ai-video-la"].keywords,
          faq: userCfg.faq || "",
          voice: userCfg.voice || "",
          business_name: userCfg.business_name || userEmail,
          chat_id: userCfg.chat_id,
          niche_label: userCfg.niche_label || "custom",
        };
      }
      // user exists but not active — log and skip
      console.log(`[pusher] user ${userEmail} not active (status=${userCfg.status})`);
      return null;
    }
  }
  // 2. Fall back to default niche from customData.niche or "ai-video-la"
  const niche = payload.customData?.niche || "ai-video-la";
  const def = NICHE_CONFIG[niche];
  if (!def) return null;
  return { tenant: niche, isUser: false, niche_label: niche, ...def };
}

// Build per-user classifier prompt that swaps in their service description.
function buildClassifierPrompt(userCfg) {
  const business = userCfg.business_name || "the business";
  const niche = userCfg.niche_description || userCfg.niche_label || "service business";
  return `You are a buyer-intent classifier for ${business} — ${niche}.
Output strict JSON only. Schema:
{"is_buyer_intent": bool, "niche_tag": "match"|"other", "urgency": 0-5, "language": "he"|"en"|"mixed"|"other", "category": "asking-for-recommendation"|"complaining-about-marketing"|"showing-pain"|"competitor-pitch"|"irrelevant", "key_signals": [...], "reasoning": "1-2 sentences"}

Urgency: 5=direct ask for ${business}'s service, 4=recommendation request in this niche, 3=pain post that ${business} can solve, 2=tangential, 1=industry-relevant no buy signal, 0=irrelevant.
Set is_buyer_intent=true ONLY if urgency>=3 AND niche_tag is "match".

What this business does (FAQ):
${userCfg.faq || "(no FAQ provided)"}

Hard rules:
- Buyer must be the END CUSTOMER for ${business}'s service, NOT a peer/competitor offering similar service.
- Match the post's language exactly: he | en | mixed.
- If post is by a service provider pitching their own offer → category=competitor-pitch, is_buyer_intent=false.
- If post asks for FREE/barter/intern → is_buyer_intent=false.`;
}

function buildDrafterPrompt(userCfg) {
  const business = userCfg.business_name || "the business";
  return `You draft Hebrew/English Facebook comment-replies for ${business}. 4-part structure: validation → insight → value → soft CTA. Match post language exactly.

Hard rules:
- Hebrew cap 400 chars / English 600 chars.
- No emojis (max one 🤝 or 👌).
- No multi-paragraph.
- Reference one specific detail from the post.
- One CTA max (or none). Soft CTA only — never "DM me" or "let's hop on a call".
- No price unless OP asked.
- Avoid AI tells: "great question", "happy to help", "absolutely", "feel free to DM".
- Anchor in the FAQ + voice provided.
- If can't draft something specific (post too vague, confidence<3) — return empty reply with warning.

FAQ:
${userCfg.faq || ""}

Voice samples + tone:
${userCfg.voice || ""}

Output strict JSON: {"reply": "...", "language": "he|en|mixed", "char_count": int, "structure_used": [...], "cta_type": "url|dm-invite|phone|none", "anchor_client": "...", "confidence": 0-5, "warnings": [...]}`;
}

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

  // Resolve runtime config (per-user from KV, or default niche).
  const cfg = await resolveConfig(payload, env);
  if (!cfg) return json({ error: "unknown tenant — no niche or user found" }, 400);

  // Return fast (Apify webhook needs <30s response); fetch datasetId + process async.
  if (ctx && typeof ctx.waitUntil === "function") {
    ctx.waitUntil(resolveAndProcess(runId, cfg, env));
  } else {
    await resolveAndProcess(runId, cfg, env);
  }
  return json({ ok: true, queued: true, runId, tenant: cfg.tenant });
}

async function resolveAndProcess(runId, cfg, env) {
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

  // If schedule-driven user run, the input contains _pusherUser. Re-resolve config.
  // (Webhook initial cfg is "default niche" because customData.user is empty.)
  if (!cfg.isUser && run.defaultKeyValueStoreId) {
    try {
      const inputResp = await fetch(
        `https://api.apify.com/v2/key-value-stores/${run.defaultKeyValueStoreId}/records/INPUT`,
        { headers: { Authorization: `Bearer ${env.APIFY_TOKEN}` } }
      );
      if (inputResp.ok) {
        const inputData = await inputResp.json();
        const userEmail = inputData?._pusherUser || inputData?.data?._pusherUser;
        if (userEmail) {
          const userCfg = await resolveConfig({ customData: { user: userEmail } }, env);
          if (userCfg) {
            console.log(`[pusher] run ${runId} routed to user ${userEmail}`);
            cfg = userCfg;
          } else {
            console.log(`[pusher] run ${runId} input had _pusherUser=${userEmail} but no active config — falling back to default`);
          }
        }
      }
    } catch (e) {
      console.error("[pusher] error fetching INPUT for routing:", e.message);
    }
  }

  await processDataset(datasetId, cfg, runId, env);
}

async function processDataset(datasetId, cfg, runId, env) {
  const threshold = parseInt(env.PUSHER_URGENCY_THRESHOLD || String(URGENCY_DEFAULT), 10);
  const maxLLMPerRun = parseInt(env.PUSHER_MAX_LLM_PER_RUN || "30", 10);

  const items = await fetchDataset(datasetId, env.APIFY_TOKEN);
  const results = { tenant: cfg.tenant, total: items.length, prefiltered: 0, classified: 0, alerts: 0, errors: 0, capped: false };

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
      draft = await groqJson(cfg.drafter, draftUserMsg(post, verdict, cfg), env, 600);
    } catch (e) {
      console.error("[pusher draft]", e.message);
      results.errors++;
      continue;
    }
    if (!draft.reply || (draft.confidence || 0) < 3) continue;

    await sendTelegramAlert(post, verdict, draft, cfg, env);
    await logAlert(post, verdict, draft, cfg, env);
    results.alerts++;
  }

  // Log run summary to KV for /pusher-stats
  await env.BQ_USERS.put(
    `pusher:run:${runId}`,
    JSON.stringify({ ts: new Date().toISOString(), runId, ...results }),
    { expirationTtl: ALERT_TTL_SECONDS }
  );
  console.log("[pusher run done]", JSON.stringify(results));
}

// ────────────────────────────────────────────────────────────────────────────
// User-facing config endpoints
// ────────────────────────────────────────────────────────────────────────────

async function _getUserByToken(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const email = await env.BQ_USERS.get(`token:${token}`);
  if (!email) return null;
  const raw = await env.BQ_USERS.get(`user:${email}`);
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function handlePusherMe(request, env) {
  const user = await _getUserByToken(request, env);
  if (!user) return json({ error: "unauthorized" }, 401);

  const beta = user.pusherBetaUntil && user.pusherBetaUntil > Date.now();
  const cfgRaw = await env.BQ_USERS.get(`pusher:user:${user.email.toLowerCase()}`);
  const cfg = cfgRaw ? JSON.parse(cfgRaw) : null;

  return json({
    email: user.email,
    has_beta: !!beta,
    beta_until: user.pusherBetaUntil ? new Date(user.pusherBetaUntil).toISOString() : null,
    config: cfg ? {
      status: cfg.status,
      business_name: cfg.business_name,
      niche_label: cfg.niche_label,
      niche_description: cfg.niche_description,
      groups_count: (cfg.groups || []).length,
      has_faq: !!cfg.faq,
      has_voice: !!cfg.voice,
      telegram_username: cfg.telegram_username,
      chat_id: cfg.chat_id,
      schedule_id: cfg.schedule_id,
      created_at: cfg.created_at,
      updated_at: cfg.updated_at,
    } : null,
    next_step: !beta ? "purchase"
      : !cfg ? "onboard"
      : !cfg.chat_id ? "wait_for_telegram_link"
      : !cfg.schedule_id ? "wait_for_schedule"
      : "live",
  });
}

export async function handlePusherOnboard(request, env) {
  const user = await _getUserByToken(request, env);
  if (!user) return json({ error: "unauthorized" }, 401);
  if (!(user.pusherBetaUntil && user.pusherBetaUntil > Date.now())) {
    return json({ error: "no active beta — please purchase first" }, 403);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400); }

  // Required fields
  const required = ["business_name", "niche_label", "niche_description", "groups", "faq", "voice", "telegram_username"];
  const missing = required.filter(k => !body[k] || (Array.isArray(body[k]) && body[k].length === 0));
  if (missing.length) return json({ error: "missing fields", missing }, 400);

  // Sanity caps
  if (body.business_name.length > 80) return json({ error: "business_name too long (max 80)" }, 400);
  if (body.niche_description.length > 500) return json({ error: "niche_description too long (max 500)" }, 400);
  if (body.faq.length > 4000) return json({ error: "faq too long (max 4000)" }, 400);
  if (body.voice.length > 4000) return json({ error: "voice too long (max 4000)" }, 400);

  // Groups: array of FB URLs
  const groupsRaw = Array.isArray(body.groups) ? body.groups : [];
  const groups = [];
  for (const g of groupsRaw) {
    const url = typeof g === "string" ? g : g.url;
    if (!url) continue;
    const m = String(url).match(/facebook\.com\/groups\/([A-Za-z0-9_.\-]+)/i);
    if (!m) return json({ error: `invalid FB group URL: ${url}` }, 400);
    groups.push({ url: `https://www.facebook.com/groups/${m[1]}/`, slug: m[1] });
  }
  if (groups.length < 1 || groups.length > 15) return json({ error: "groups must be 1–15" }, 400);

  // Telegram username — store, but link to chat_id happens via admin
  const tgUser = String(body.telegram_username).trim().replace(/^@/, "");
  if (!/^[A-Za-z0-9_]{3,32}$/.test(tgUser)) return json({ error: "invalid telegram username" }, 400);

  const now = new Date().toISOString();
  const existingRaw = await env.BQ_USERS.get(`pusher:user:${user.email.toLowerCase()}`);
  const existing = existingRaw ? JSON.parse(existingRaw) : {};
  const cfg = {
    ...existing,
    email: user.email,
    business_name: body.business_name,
    niche_label: body.niche_label,
    niche_description: body.niche_description,
    groups,
    faq: body.faq,
    voice: body.voice,
    telegram_username: tgUser,
    keywords: body.keywords || null, // optional override
    chat_id: existing.chat_id || null,
    schedule_id: existing.schedule_id || null,
    status: existing.chat_id ? "active" : "awaiting_telegram_link",
    created_at: existing.created_at || now,
    updated_at: now,
  };

  await env.BQ_USERS.put(`pusher:user:${user.email.toLowerCase()}`, JSON.stringify(cfg));

  // Update beta index marker so admin sees "configured"
  await env.BQ_USERS.put(`pusher:beta:${user.email.toLowerCase()}`, JSON.stringify({
    email: user.email,
    ts: now,
    until: user.pusherBetaUntil ? new Date(user.pusherBetaUntil).toISOString() : null,
    status: cfg.status,
    business_name: cfg.business_name,
    telegram_username: cfg.telegram_username,
  }));

  return json({ ok: true, status: cfg.status, next_step: cfg.status === "active" ? "live" : "wait_for_telegram_link" });
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

// ────────────────────────────────────────────────────────────────────────────
// Apify schedule provisioning per user
// ────────────────────────────────────────────────────────────────────────────

const ACTOR_ID = "TbRkI5wBA2Hs4yiEI"; // crowdpull/facebook-group-posts-scraper

// Daily UTC slot per user — staggered 0–23 to spread load. Hash email → hour.
function _emailToCronHour(email) {
  let h = 0;
  for (const c of String(email)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 24;
}

async function _apifyApi(method, path, env, body) {
  const url = `https://api.apify.com${path}`;
  const headers = { Authorization: `Bearer ${env.APIFY_TOKEN}` };
  let data = null;
  if (body !== undefined) {
    data = JSON.stringify(body);
    headers["Content-Type"] = "application/json";
  }
  const r = await fetch(url, { method, headers, body: data });
  if (!r.ok) {
    const txt = (await r.text()).slice(0, 400);
    throw new Error(`apify ${method} ${path} → ${r.status} ${txt}`);
  }
  return r.json();
}

async function provisionUserSchedule(cfg, env) {
  // Build actor input from user's groups
  const startUrls = (cfg.groups || []).map(g => ({ url: g.url || g }));
  if (!startUrls.length) throw new Error("no groups to scrape");

  const actorInput = {
    startUrls,
    maxPosts: 30,
    sortOrder: "CHRONOLOGICAL",
    onlyPostsNewerThan: "1d",
    includeTopComments: true,
    enableDedup: true,
    proxyConfig: { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] },
    // BQ Pusher routing: actor ignores unknown keys but we read them in the worker
    // via fetch of the run's INPUT key-value to identify which user owns the run.
    _pusherUser: cfg.email,
  };

  const cronHour = _emailToCronHour(cfg.email);
  const slug = `pusher-user-${(cfg.email || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;

  const payload = {
    title: `Pusher · ${cfg.business_name || cfg.email}`,
    name: slug,
    cronExpression: `0 ${cronHour} * * *`,
    timezone: "UTC",
    isEnabled: true,
    isExclusive: true,
    description: `Auto-created by Pusher onboarding for ${cfg.email}`,
    actions: [{
      type: "RUN_ACTOR",
      actorId: ACTOR_ID,
      runInput: { body: JSON.stringify(actorInput), contentType: "application/json" },
    }],
  };

  let scheduleId = cfg.schedule_id;
  if (scheduleId) {
    // Update existing
    try {
      const r = await _apifyApi("PUT", `/v2/schedules/${scheduleId}`, env, payload);
      return { scheduleId: r.data.id, action: "updated" };
    } catch (e) {
      // Maybe schedule was deleted externally — fall through to create
      console.error("[provision] update failed, creating fresh:", e.message);
    }
  }
  // Create new
  const r = await _apifyApi("POST", `/v2/schedules`, env, payload);
  return { scheduleId: r.data.id, action: "created" };
}

async function provisionUserWebhook(cfg, env) {
  // Per-user webhook on the actor — filtered to runs where actorRunId matches
  // actor (we condition on actorTaskId not directly, so we use a different approach):
  // We use a SINGLE shared webhook on the actor that includes customData.user.
  // The schedule passes customData via runInput.metadata? — Apify schedules don't
  // forward customData to webhooks unless declared on the webhook itself.
  //
  // Simpler: create a per-user webhook tied to runs of this actor where
  // customData.user matches. Apify supports condition.actorId only.
  //
  // For MVP, we keep ONE webhook and rely on the schedule's actor-input to route.
  // The runId-based resolveAndProcess will look up the user by run input metadata.
  // That requires reading run.input on the worker side and matching email.
  //
  // To keep things simple, encode email into the run options:
  //   action.runOptions.metadata = { user_email: cfg.email }
  // Then on webhook, fetch the run and read its input metadata.

  // No-op for now — handled via run input metadata in schedule action.
  return null;
}

export async function handlePusherProvisionSchedule(request, env) {
  const url = new URL(request.url);
  if (!_checkAdminPass(url, env)) return json({ error: "unauthorized" }, 401);
  const email = (url.searchParams.get("email") || "").toLowerCase().trim();
  if (!email) return json({ error: "email required" }, 400);

  const cfgRaw = await env.BQ_USERS.get(`pusher:user:${email}`);
  if (!cfgRaw) return json({ error: "user not configured" }, 404);
  const cfg = JSON.parse(cfgRaw);

  if (cfg.status !== "active") return json({ error: `user not active (status=${cfg.status})` }, 400);
  if (!(cfg.groups || []).length) return json({ error: "no groups configured" }, 400);

  try {
    const result = await provisionUserSchedule(cfg, env);
    cfg.schedule_id = result.scheduleId;
    cfg.updated_at = new Date().toISOString();
    await env.BQ_USERS.put(`pusher:user:${email}`, JSON.stringify(cfg));
    return json({ ok: true, ...result });
  } catch (e) {
    return json({ error: e.message }, 502);
  }
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

export async function handlePusherAdminUserGet(request, env) {
  const url = new URL(request.url);
  if (!_checkAdminPass(url, env)) return json({ error: "unauthorized" }, 401);
  const email = (url.searchParams.get("email") || "").toLowerCase().trim();
  if (!email) return json({ error: "email required" }, 400);
  const cfgRaw = await env.BQ_USERS.get(`pusher:user:${email}`);
  const indexRaw = await env.BQ_USERS.get(`pusher:beta:${email}`);
  return json({
    email,
    config: cfgRaw ? JSON.parse(cfgRaw) : null,
    index: indexRaw ? JSON.parse(indexRaw) : null,
  });
}

export async function handlePusherAdminUserUpdate(request, env) {
  const url = new URL(request.url);
  if (!_checkAdminPass(url, env)) return json({ error: "unauthorized" }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400); }
  const email = String(body.email || "").toLowerCase().trim();
  if (!email) return json({ error: "email required" }, 400);

  const cfgRaw = await env.BQ_USERS.get(`pusher:user:${email}`);
  if (!cfgRaw) return json({ error: "user not found" }, 404);
  const cfg = JSON.parse(cfgRaw);

  const allowed = ["business_name", "niche_label", "niche_description", "groups", "faq", "voice",
    "telegram_username", "chat_id", "keywords", "status", "schedule_id"];
  let changed = false;
  for (const k of allowed) {
    if (body[k] !== undefined && body[k] !== null) {
      cfg[k] = body[k];
      changed = true;
    }
  }
  if (!changed) return json({ error: "no fields updated" }, 400);

  cfg.updated_at = new Date().toISOString();

  // Recompute status if chat_id newly set
  if (cfg.chat_id && cfg.status === "awaiting_telegram_link") {
    cfg.status = "active";
  }

  // Auto-provision Apify schedule once user has groups + chat_id + active status
  if (cfg.status === "active" && (cfg.groups || []).length > 0 && cfg.chat_id) {
    try {
      const result = await provisionUserSchedule(cfg, env);
      cfg.schedule_id = result.scheduleId;
      console.log(`[pusher] schedule ${result.action} for ${email}: ${result.scheduleId}`);
    } catch (e) {
      console.error(`[pusher] schedule provision failed for ${email}:`, e.message);
    }
  }

  await env.BQ_USERS.put(`pusher:user:${email}`, JSON.stringify(cfg));

  // Sync the beta index
  const indexRaw = await env.BQ_USERS.get(`pusher:beta:${email}`);
  if (indexRaw) {
    const idx = JSON.parse(indexRaw);
    idx.status = cfg.status;
    idx.business_name = cfg.business_name;
    idx.telegram_username = cfg.telegram_username;
    await env.BQ_USERS.put(`pusher:beta:${email}`, JSON.stringify(idx));
  }

  return json({ ok: true, status: cfg.status });
}

export async function handlePusherAdminLinkTelegram(request, env) {
  // Resolves @username → chat_id by scanning the bot's recent updates.
  // User must have messaged @bqpusher_bot at least once.
  const url = new URL(request.url);
  if (!_checkAdminPass(url, env)) return json({ error: "unauthorized" }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400); }
  const email = String(body.email || "").toLowerCase().trim();
  const username = String(body.telegram_username || "").trim().replace(/^@/, "");
  if (!email || !username) return json({ error: "email and telegram_username required" }, 400);

  // Fetch recent updates from bot
  const updResp = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getUpdates?limit=100&offset=-100`);
  if (!updResp.ok) return json({ error: `telegram getUpdates ${updResp.status}` }, 502);
  const upd = await updResp.json();
  if (!upd.ok) return json({ error: `telegram error ${JSON.stringify(upd).slice(0, 200)}` }, 502);

  // Find a message from this username
  let chatId = null;
  for (const u of upd.result || []) {
    const from = u.message?.from || u.message?.chat;
    if (!from) continue;
    if ((from.username || "").toLowerCase() === username.toLowerCase()) {
      chatId = from.id;
      break;
    }
  }
  if (!chatId) {
    return json({
      error: "username not found in recent updates",
      hint: "User must DM @bqpusher_bot first (any message). Then retry within 24h."
    }, 404);
  }

  // Save to user config
  const cfgRaw = await env.BQ_USERS.get(`pusher:user:${email}`);
  if (!cfgRaw) return json({ error: "user config not found — they need to onboard first" }, 404);
  const cfg = JSON.parse(cfgRaw);
  cfg.chat_id = String(chatId);
  cfg.telegram_username = username;
  cfg.updated_at = new Date().toISOString();
  if (cfg.status === "awaiting_telegram_link") cfg.status = "active";

  // Auto-provision Apify schedule on telegram link (final step before live)
  if (cfg.status === "active" && (cfg.groups || []).length > 0) {
    try {
      const result = await provisionUserSchedule(cfg, env);
      cfg.schedule_id = result.scheduleId;
      console.log(`[pusher] schedule ${result.action} for ${email}: ${result.scheduleId}`);
    } catch (e) {
      console.error(`[pusher] schedule provision failed for ${email}:`, e.message);
    }
  }

  await env.BQ_USERS.put(`pusher:user:${email}`, JSON.stringify(cfg));

  // Sync index
  const indexRaw = await env.BQ_USERS.get(`pusher:beta:${email}`);
  if (indexRaw) {
    const idx = JSON.parse(indexRaw);
    idx.status = cfg.status;
    idx.telegram_username = username;
    await env.BQ_USERS.put(`pusher:beta:${email}`, JSON.stringify(idx));
  }

  // Send a confirmation DM to the user
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: `✅ *${cfg.business_name || "Your"} Pusher* is now linked.\n\nYou'll start receiving buyer-intent alerts here. First scan: next scheduled run.`,
      parse_mode: "Markdown",
    }),
  });

  return json({ ok: true, chat_id: chatId, status: cfg.status });
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

function draftUserMsg(post, verdict, cfg) {
  return `<post>${truncate(post.body, 2000)}</post>
<author>${post.author}</author>
<group>${post.group}</group>
<top_comments>${truncate(JSON.stringify(post.top_comments), 1500)}</top_comments>
<classification>${JSON.stringify(verdict)}</classification>
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

async function sendTelegramAlert(post, verdict, draft, cfg, env) {
  const chatId = cfg.chat_id || env.MOSHE_CHAT_ID || "369310707";
  const lang = (verdict.language || "en").toUpperCase();
  const fire = "🔥".repeat(Math.max(1, Math.min(5, verdict.urgency || 3)));
  const businessTag = cfg.business_name ? `_${cfg.business_name}_\n` : "";
  const text = `🎯 *Pusher alert* ${fire}
${businessTag}*${post.author}* @ ${post.group}
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

async function logAlert(post, verdict, draft, cfg, env) {
  const ts = new Date().toISOString();
  const id = ts.replace(/[^0-9]/g, "").slice(0, 17);
  await env.BQ_USERS.put(
    `pusher:alert:${id}`,
    JSON.stringify({ ts, tenant: cfg.tenant, isUser: !!cfg.isUser, post, verdict, draft }),
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

What BQ sells: AI-generated cinematic vertical video content. Marketing reels for service businesses. Active client = Sherman Oaks remodeler ($2,700/mo for 16 videos/month).

Output strict JSON only. Schema:
{"is_buyer_intent": bool, "niche_tag": "ai-video-la"|"other", "urgency": 0-5, "language": "he"|"en"|"mixed"|"other", "category": "asking-for-recommendation"|"complaining-about-marketing"|"showing-pain"|"competitor-pitch"|"irrelevant", "key_signals": [...], "reasoning": "1-2 sentences"}

Urgency scale (specific to AI VIDEO niche):
- 5 = direct ask for "videographer", "video editor", "content creator", "promo video", "reel for my business"
- 4 = recommendation request for marketing/social/Instagram help with explicit content angle
- 3 = pain post about marketing/content/Instagram failure where video would solve it
- 2 = tangential (industry-relevant, but not video-specific)
- 1 = adjacent but no buy signal
- 0 = irrelevant

CRITICAL FILTERING — these are NOT buyer-intent (set is_buyer_intent=false):
- Homeowner/buyer looking to HIRE a contractor → niche_tag=other (we sell to contractors, not for them)
- Looking for cleaning/concrete/plumbing/specific trade → other (not our service)
- Free/barter/intern/volunteer asks → irrelevant
- Other agencies pitching video/marketing services → competitor-pitch
- Recruiters hiring W-2 → other
- General industry chatter, news, completed-project showcases without an ask → 1 or 2 max
- Contractors POSTING about jobs they completed (without asking for help) → 1 max

YES buyer-intent (is_buyer_intent=true) requires ALL of:
1. The author is a SERVICE BUSINESS in LA (contractor, remodeler, realtor, designer, Israeli LA SMB)
2. They show a specific need for VIDEO / SOCIAL / CONTENT / MARKETING help
3. They are NOT pitching their own service in the same post
4. They are NOT looking for a tradesman to do work for them (that's wrong direction)

Match language exactly: he | en | mixed.`;
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
