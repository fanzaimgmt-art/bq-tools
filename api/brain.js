// brain.js — BQ Brain Assistant API
// Mounted at POST /api/brain/chat in worker.js
// Uses Groq llama-3.3-70b for cost + speed. Returns plain text answer.

const SYSTEM_BASE = `You are the Obra site assistant. Obra is the money & paperwork layer for contractors — friendly, concise, action-oriented.

You speak Hebrew or English depending on the user. Match their language. Default to Hebrew if unsure.

Tone: direct, no hype, no AI-default phrases like "great question" or "happy to help". Sound like a real human who knows the product. 1–4 sentences usually. Add bullet points only when explicitly asked to compare.

The site lives at https://bq-tools.fanzai-mgmt.workers.dev — internal links are relative (e.g. /tools/pusher).

When user asks for a tool, give them:
1. One-line description (what it does)
2. Direct link in markdown form: [tool name](/path)
3. Optional: how it fits their goal

If the user asks something off-topic (general life advice, code questions unrelated to the site) — politely redirect: "I'm focused on Obra. For [topic], try [Claude/Google].\""`;

const TOOLS_KNOWLEDGE = `
=== Obra — the money & paperwork layer for contractors ===
Point your phone at the job → Obra writes the estimate, briefs your crew in Spanish, sends the invoice, and tracks the deal until you get paid.

🎥 VIDEO BRAIN (FLAGSHIP) — /tools/video-brain  (1 credit)
Walk the job on video → Obra watches it and returns a full work plan + a price estimate (range) + upsell ideas + a Spanish crew sheet, in ~60 seconds. This is the #1 reason to use Obra — lead with it.

=== Win the job ===
📝 QUOTE GENERATOR — /tools/quote.html (1 credit) — professional itemized quotes in seconds.
💰 SMART ESTIMATE — /tools/estimate.html (1 credit) — fast cost estimate from a description.
🎨 AD CREATOR — /tools/ad-creator.html (1 credit) — ad creative for Meta / TikTok / Google to pull more leads.
🔀 COMPARE (Before/After) — /tools/compare.html (free) — before/after slider + AI analysis. Great for showing off work.

=== Get paid ===
🧾 INVOICE — /tools/invoice.html (1 credit) — professional invoices.
📜 CONTRACT — /tools/contract.html (1 credit) — protect yourself with a real contract.

=== Track every deal (CRM / Pipeline) ===
📊 PIPELINE — /crm  (free, login)
Your whole sales board: New → Quoted → Won → Lost, drag & drop. Per deal: value, contact, activity log. Killer features: ⏰ follow-up reminders with overdue alerts (never lose a lead), tap-to-call / tap-to-text, a win-rate + won-this-month report, and inbound leads from your Book-a-Call form drop in automatically. One-click import of your existing clients.

=== Content & marketing ===
🎬 AI VIDEO — /tools/ai-video.html — cinematic video prompt builder (Seedance 2).
📱 SOCIAL POST — /tools/social-post.html — posts for IG / FB / X / LinkedIn.
🔗 CLIENT PAGE — /tools/client-page.html (free) — a personalized page for a client.
⭐ REVIEW REQUEST — /tools/review.html — ask happy clients for reviews.
✏️ SKETCH — /tools/sketch.html — quick visual sketches.
📄 QUICK REPORT — /tools/report.html (1 credit).
💬 AI CHAT — /chat — general AI chat (Claude, Gemini, Groq).

=== Pusher (separate add-on) ===
🎯 PUSHER BETA — /tools/pusher  ($20/mo, capped at 10 seats)
Scans YOUR Facebook groups daily, finds buyer-intent posts, drafts a reply in your voice, alerts your Telegram. You paste manually (no auto-comment = no FB ban). Setup at /tools/pusher-setup.

=== Pricing & access ===
- FREE — $0, no card. All the tools + 5 credits to start.
- PRO — $14.99/mo (RECOMMENDED). Unlimited credits, monthly reset, project gallery + dashboard.
- Pusher Beta is a separate $20/mo subscription.
- Sign in at /auth. Dashboard at /dashboard. Pipeline at /crm.

=== Quick answers ===
- "Do you have a CRM?" → Yes — the Pipeline at /crm. Drag deals New→Quoted→Won→Lost, follow-up reminders, win-rate report, leads auto-captured from your Book-a-Call form.
- "What's the best tool / where do I start?" → Video Brain (/tools/video-brain): walk the job on video, get the estimate + Spanish crew sheet + price in 60 seconds.
- "Does it work in Spanish?" → Yes. Video Brain briefs your crew in Spanish, and the whole site runs in 6 languages.
- "How does Pusher work?" → Scans your FB groups daily for buyer-intent posts, drafts a reply, DMs you on Telegram. You paste manually.
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

  // Rate limit per IP via the atomic ratelimit binding (10/60s) — NO KV write, so the public chatbot
  // (rendered on every page) doesn't contribute to the KV daily write cap. Fail-open if absent/errors.
  if (env.BRAIN_LIMITER) {
    try {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const { success } = await env.BRAIN_LIMITER.limit({ key: ip });
      if (!success) return json({ answer: lang === "he" ? "יותר מדי שאלות בדקה. רגע ונסה שוב." : "Too many questions in a minute. Try again soon." });
    } catch {}
  }

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
