// brain.js — BQ Brain Assistant API
// Mounted at POST /api/brain/chat in worker.js
// Uses Groq llama-3.3-70b for cost + speed. Returns plain text answer.

const SYSTEM_BASE = `You are the Obra site assistant — friendly, concise, action-oriented.

You speak Hebrew or English depending on the user. Match their language. Default to Hebrew if unsure.

Tone: direct, no hype, no AI-default phrases like "great question" or "happy to help". Sound like a real human who knows the product. 1–4 sentences usually. Add bullet points only when explicitly asked to compare.

The site lives at https://bq-tools.fanzai-mgmt.workers.dev — internal links are relative (e.g. /tools/pusher).

When user asks for a tool, give them:
1. One-line description (what it does)
2. Direct link in markdown form: [tool name](/path)
3. Optional: how it fits their goal

If the user asks something off-topic (general life advice, code questions unrelated to the site) — politely redirect: "I'm focused on Obra. For [topic], try [Claude/Google].\""`;

const TOOLS_KNOWLEDGE = `
=== Obra — full toolbox ===

🎯 PUSHER BETA — /tools/pusher  ($20/mo, capped at 10 seats)
Buyer-intent Facebook lead engine. Scans 3–10 of YOUR FB groups daily, classifies posts as buyer-intent via AI, drafts a 4-part comment-reply in your voice, sends alert to your Telegram. You paste the reply manually. Setup at /tools/pusher-setup.

🧠 IMPORT AI MEMORY — /tools/import-memory.html (free, limited)
Import memory from another AI account.

🔀 COMPARE — /tools/compare.html (free)
Compare anything — products, services, plans.

📄 QUICK REPORT — /tools/report.html (1 credit)
Generate quick reports.

💰 SMART ESTIMATE — /tools/estimate.html (1 credit)
Smart cost estimate generator.

🔗 CLIENT PAGE — /tools/client-page.html (free)
Generate a personalized client page.

📱 SOCIAL POST — /tools/social-post.html
Generate social media posts.

⭐ REVIEW REQUEST — /tools/review.html
Generate review request messages.

✏️ QUICK SKETCH — /tools/sketch.html
Quick visual sketches.

📊 SOCIAL ANALYSIS — /tools/social-analysis.html
Analyze social media metrics.

💬 AI CHAT — /chat.html
General-purpose AI chat (Claude, Gemini, Groq).

🔍 CONTENT SPY — /tools/content-spy.html
Competitor content research.

📥 DOWNLOADER — /tools/downloader.html
Download/extract content.

💖 MOODBOARD — /tools/moodboard.html
Visual moodboard generator.

📝 QUOTE — /tools/quote.html
Quote generator.

🧾 INVOICE — /tools/invoice.html
Invoice generator.

📜 CONTRACT — /tools/contract.html
Contract generator.

🎬 AI VIDEO — /tools/ai-video.html
AI cinematic video prompt builder powered by Seedance 2.

🎨 AD CREATOR — /tools/ad-creator.html
Ad creative generator.

=== Pricing & access ===
- New users get 5 free credits.
- Pro tier is $14.99/mo for unlimited credits + monthly resets (currently being launched).
- Pusher Beta is a separate $20/mo subscription.
- Login at /auth.html. Dashboard at /dashboard.html.

=== Pusher quick FAQ ===
- "How does Pusher work?" → It scans Facebook groups daily, finds posts where someone shows buyer intent for your service, drafts a smart comment-reply in your voice, and DMs you on Telegram. You paste manually (no auto-comment — FB ban risk).
- "Who is Pusher for?" → Service businesses (contractors, coaches, designers, agencies) who want clients from organic FB without writing posts themselves.
- "When does it run?" → Once daily at your scheduled UTC slot (auto-staggered per user).
- "How long until first alert?" → Same day or next day after onboarding + Telegram link.
- "Can I cancel?" → Yes, anytime. No questions.
- "Why $20/mo and not $99?" → Beta launch. After 10 seats fill, price moves to $99/mo. Beta users keep $20 forever (grandfathered).
`;

export async function handleBrainChat(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400); }
  const question = String(body.question || "").trim();
  if (!question || question.length > 1000) return json({ error: "invalid question" }, 400);

  const lang = body.lang === "he" ? "he" : "en";
  const page = String(body.page || "").slice(0, 100);
  const historyIn = Array.isArray(body.history) ? body.history.slice(-12) : [];

  // Build messages
  const systemPrompt = `${SYSTEM_BASE}

User language: ${lang === "he" ? "Hebrew" : "English"}.
${page ? `Current page: ${page}` : ""}

${TOOLS_KNOWLEDGE}`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...historyIn.map(h => ({
      role: h.role === "assistant" ? "assistant" : "user",
      content: String(h.content || "").slice(0, 2000),
    })),
    { role: "user", content: question },
  ];

  // Rate limit per IP (loose) — track in KV with 60s TTL
  try {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const key = `brain:rate:${ip}`;
    const cur = parseInt((await env.BQ_USERS.get(key)) || "0", 10);
    if (cur >= 10) return json({ answer: lang === "he" ? "יותר מדי שאלות בדקה. רגע ונסה שוב." : "Too many questions in a minute. Try again soon." });
    await env.BQ_USERS.put(key, String(cur + 1), { expirationTtl: 60 });
  } catch {}

  // Call Groq
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.PUSHER_GROQ_MODEL || "llama-3.3-70b-versatile",
        max_tokens: 500,
        temperature: 0.4,
        messages,
      }),
    });
    if (!r.ok) {
      const txt = (await r.text()).slice(0, 200);
      console.error("[brain] groq error", r.status, txt);
      return json({ error: "AI service error", detail: txt }, 502);
    }
    const data = await r.json();
    const answer = data.choices?.[0]?.message?.content || "";
    return json({ answer });
  } catch (e) {
    console.error("[brain] error", e.message);
    return json({ error: e.message }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}
