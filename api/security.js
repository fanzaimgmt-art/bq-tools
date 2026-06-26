/* security.js — BQ Tools security middleware
   Wired at the top of worker.fetch so every request is gated.

   Layers (in order):
     1. Permanent IP block list      (KV: sec:ban:<ip> → ts of unblock)
     2. Probe-path scanner            (wp-admin, .env, .git, /phpinfo, etc.)
     3. Bad User-Agent screen         (sqlmap, nmap, nikto, masscan, etc.)
     4. Per-IP rate limit             (60 req / 10s burst)
     5. Per-IP daily request count    (KV stat for admin)

   On violation: log incident → optionally ban → return 403 / 429 → Telegram alert if severe.

   Public:
     - securityGate(request, env, ctx) → null (pass) | Response (deny)
     - logSecurityEvent(req, env, type, details)
     - addSecurityHeaders(response)
     - handleSecurityLog (admin GET)
     - handleSecurityUnban (admin POST)
*/

const RATE_LIMIT_WINDOW = 10;          // seconds
const RATE_LIMIT_BURST = 60;           // max req per window per IP
const BAN_DURATION_SECONDS = 60 * 60;  // 1h auto-ban
const SEVERE_BAN_DURATION_SECONDS = 24 * 60 * 60; // 24h for probes
const ALERT_THROTTLE_SECONDS = 300;    // dedupe Telegram alerts

const PROBE_PATHS = [
  // PHP / WordPress (we don't run either)
  "/wp-admin", "/wp-login", "/wp-content", "/xmlrpc.php", "/wp-config.php",
  "/phpinfo", "/phpmyadmin", "/.php", "/info.php", "/test.php",
  // Secrets/config probing
  "/.env", "/.git/", "/.svn", "/.aws", "/config.json", "/composer.json",
  "/.htaccess", "/.htpasswd", "/server-status",
  // Backup files
  "/backup.zip", "/backup.tar", "/db.sql", "/dump.sql", "/database.sql",
  // Common admin probes
  "/admin/config", "/cgi-bin/", "/manager/html", "/console/", "/jenkins",
  "/actuator", "/struts2", "/_ignition",
  // Shell upload
  "/shell.php", "/upload.php", "/eval.php", "/cmd.php",
];

// Pentest / vulnerability scanners — instant ban.
// We do NOT block plain curl/python/Go since those have legitimate uses
// (webhooks, monitoring scripts, MCP integrations, etc).
const BAD_UA_PATTERNS = [
  /sqlmap/i, /nmap/i, /nikto/i, /masscan/i, /acunetix/i, /netsparker/i,
  /openvas/i, /nessus/i, /metasploit/i, /burpsuite/i, /havij/i,
  /zaproxy/i, /skipfish/i, /xspider/i, /webvulnscan/i, /wpscan/i,
];

// Endpoints that always pass UA checks (kept for future scripted-tool blocks).
const TOOL_ALLOWLIST = new Set([
  "/api/payments/stripe/webhook",
  "/api/pusher-webhook",
  "/api/pusher-health",
  "/api/pusher-beta-seats",
  "/api/security-health",
  "/api/admin/check-auth",
  "/api/config/flags",
]);

export async function securityGate(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
  const ua = request.headers.get("User-Agent") || "";
  const method = request.method;

  // 1. Permanent ban check
  const banKey = `sec:ban:${ip}`;
  const banUntil = await env.BQ_USERS.get(banKey);
  if (banUntil) {
    return _deny(env, ip, ua, path, "ip_banned", 403, ctx, request, { banUntil });
  }

  // 2. Probe-path scanner — instant severe ban
  for (const probe of PROBE_PATHS) {
    if (path.toLowerCase().startsWith(probe)) {
      await _ban(env, ip, SEVERE_BAN_DURATION_SECONDS);
      const denied = await _deny(env, ip, ua, path, "probe_path", 403, ctx, request, { matched: probe });
      // Telegram alert on severe probes
      if (ctx) ctx.waitUntil(_alertTelegram(env, "🚨 Probe attack blocked", `IP ${ip} hit ${probe}\nUA: ${ua.slice(0, 80)}\nBanned 24h.`));
      return denied;
    }
  }

  // 3. Pentest-tool UA screen — instant 24h ban + alert
  if (ua) {
    for (const bad of BAD_UA_PATTERNS) {
      if (bad.test(ua)) {
        await _ban(env, ip, SEVERE_BAN_DURATION_SECONDS);
        if (ctx) ctx.waitUntil(_alertTelegram(env, "🚨 Pentest tool detected", `IP ${ip} UA=${ua.slice(0, 80)}\nPath: ${path}\nBanned 24h.`));
        return _deny(env, ip, ua, path, "pentest_tool", 403, ctx, request, { ua: ua.slice(0, 80) });
      }
    }
  }

  // 4. Rate limit (skip OPTIONS preflights)
  if (method !== "OPTIONS") {
    const rateKey = `sec:rate:${ip}:${Math.floor(Date.now() / 1000 / RATE_LIMIT_WINDOW)}`;
    const cur = parseInt((await env.BQ_USERS.get(rateKey)) || "0", 10);
    if (cur >= RATE_LIMIT_BURST) {
      // After 3 rate-limit hits in a row, auto-ban for 1h
      const violKey = `sec:rateviol:${ip}`;
      const viols = parseInt((await env.BQ_USERS.get(violKey)) || "0", 10) + 1;
      await env.BQ_USERS.put(violKey, String(viols), { expirationTtl: 600 });
      if (viols >= 3) {
        await _ban(env, ip, BAN_DURATION_SECONDS);
        if (ctx) ctx.waitUntil(_alertTelegram(env, "⚠️ Rate-limit abuse → auto-ban", `IP ${ip} hit rate-limit ${viols}× in 10min\nPath: ${path}\nBanned 1h.`));
      }
      return _deny(env, ip, ua, path, "rate_limit", 429, ctx, request, { count: cur, burst: RATE_LIMIT_BURST });
    }
    await env.BQ_USERS.put(rateKey, String(cur + 1), { expirationTtl: 60 });
  }

  // 5. Daily counter (for stats)
  if (ctx) {
    const dayKey = `sec:day:${new Date().toISOString().slice(0, 10)}`;
    ctx.waitUntil((async () => {
      const cur = parseInt((await env.BQ_USERS.get(dayKey)) || "0", 10);
      await env.BQ_USERS.put(dayKey, String(cur + 1), { expirationTtl: 60 * 60 * 48 });
    })());
  }

  // Pass — return null
  return null;
}

async function _ban(env, ip, ttlSeconds) {
  const until = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  await env.BQ_USERS.put(`sec:ban:${ip}`, until, { expirationTtl: ttlSeconds });
}

async function _deny(env, ip, ua, path, reason, status, ctx, request, extra = {}) {
  const ts = new Date().toISOString();
  const id = ts.replace(/[^0-9]/g, "").slice(0, 17) + "-" + Math.random().toString(36).slice(2, 6);
  const event = { ts, id, ip, ua: ua.slice(0, 200), path, method: request.method, reason, status, ...extra };
  if (ctx && env.BQ_USERS) {
    ctx.waitUntil(env.BQ_USERS.put(`sec:event:${id}`, JSON.stringify(event), { expirationTtl: 60 * 60 * 24 * 14 }));
  }
  return new Response(
    JSON.stringify({ error: "blocked", reason, retry_after: status === 429 ? RATE_LIMIT_WINDOW : null }),
    {
      status,
      headers: {
        "content-type": "application/json",
        "retry-after": String(RATE_LIMIT_WINDOW),
        "x-bq-block": reason,
      },
    }
  );
}

export async function logSecurityEvent(request, env, type, details = {}) {
  if (!env.BQ_USERS) return;
  const ts = new Date().toISOString();
  const id = ts.replace(/[^0-9]/g, "").slice(0, 17) + "-" + Math.random().toString(36).slice(2, 6);
  const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
  const ua = (request.headers.get("User-Agent") || "").slice(0, 200);
  const url = new URL(request.url);
  const event = { ts, id, ip, ua, path: url.pathname, method: request.method, type, ...details };
  await env.BQ_USERS.put(`sec:event:${id}`, JSON.stringify(event), { expirationTtl: 60 * 60 * 24 * 14 });
}

export async function trackFailedAdminAuth(request, env, ctx) {
  const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
  const key = `sec:adminfail:${ip}`;
  const cur = parseInt((await env.BQ_USERS.get(key)) || "0", 10) + 1;
  await env.BQ_USERS.put(key, String(cur), { expirationTtl: 60 });
  await logSecurityEvent(request, env, "admin_auth_fail", { count: cur });
  if (cur >= 5) {
    await _ban(env, ip, BAN_DURATION_SECONDS);
    if (ctx) ctx.waitUntil(_alertTelegram(env, "🚨 Admin brute-force blocked", `IP ${ip} had ${cur} failed admin logins/min.\nBanned 1h.`));
  }
  return cur;
}

async function _alertTelegram(env, title, body) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.MOSHE_CHAT_ID) {
    console.log("[security alert]", title, body);
    return;
  }
  // Throttle dupes
  const key = `sec:alert:${title}`;
  const last = await env.BQ_USERS.get(key);
  if (last && Date.now() - parseInt(last, 10) < ALERT_THROTTLE_SECONDS * 1000) return;
  await env.BQ_USERS.put(key, String(Date.now()), { expirationTtl: ALERT_THROTTLE_SECONDS + 30 });
  try {
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: env.MOSHE_CHAT_ID || "369310707",
        text: `*${title}*\n${body}`,
        parse_mode: "Markdown",
      }),
    });
  } catch (e) {
    console.error("[security alert] tg fail", e.message);
  }
}

// ─── Security headers (apply to all responses) ────────────────────────────
export function addSecurityHeaders(response, request) {
  // Don't break preflight responses
  if (response.status === 204) return response;
  // Headers safe to add to ANY response, including JSON APIs
  const headers = new Headers(response.headers);
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=(self)");
  headers.set("X-XSS-Protection", "0"); // modern browsers; CSP handles
  // CSP — only for HTML responses to avoid breaking inline JSON tools
  const ctype = headers.get("content-type") || "";
  if (ctype.startsWith("text/html")) {
    headers.set("Content-Security-Policy",
      "default-src 'self' https://bq-tools.fanzai-mgmt.workers.dev https://bq-tools-api.fanzai-mgmt.workers.dev; " +
      "script-src 'self' 'unsafe-inline' https://accounts.google.com https://js.stripe.com https://unpkg.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "img-src 'self' data: https: blob:; " +
      "connect-src 'self' https://bq-tools-api.fanzai-mgmt.workers.dev https://api.stripe.com https://api.telegram.org https://accounts.google.com; " +
      "frame-src https://js.stripe.com https://hooks.stripe.com https://accounts.google.com; " +
      "frame-ancestors 'none';"
    );
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

// ─── Admin endpoints ───────────────────────────────────────────────────────
function _checkAdmin(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const auth = request.headers.get("Authorization") || "";
  const pw = auth.replace(/^Bearer\s+/i, "").trim();
  return pw === env.ADMIN_PASSWORD;
}
function _json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
}

export async function handleSecurityLog(request, env) {
  if (!_checkAdmin(request, env)) return _json({ error: "unauthorized" }, 401);
  const list = await env.BQ_USERS.list({ prefix: "sec:event:", limit: 200 });
  const events = [];
  for (const k of list.keys.slice(-100)) {
    const raw = await env.BQ_USERS.get(k.name);
    if (raw) events.push(JSON.parse(raw));
  }
  events.sort((a, b) => (a.ts < b.ts ? 1 : -1));
  // Stats
  const today = new Date().toISOString().slice(0, 10);
  const dayCount = parseInt((await env.BQ_USERS.get(`sec:day:${today}`)) || "0", 10);
  return _json({ events: events.slice(0, 100), total_today: dayCount });
}

export async function handleSecurityBans(request, env) {
  if (!_checkAdmin(request, env)) return _json({ error: "unauthorized" }, 401);
  const list = await env.BQ_USERS.list({ prefix: "sec:ban:", limit: 100 });
  const bans = [];
  for (const k of list.keys) {
    const raw = await env.BQ_USERS.get(k.name);
    if (raw) bans.push({ ip: k.name.replace("sec:ban:", ""), until: raw });
  }
  return _json({ bans, count: bans.length });
}

export async function handleSecurityUnban(request, env) {
  if (!_checkAdmin(request, env)) return _json({ error: "unauthorized" }, 401);
  let body;
  try { body = await request.json(); } catch { return _json({ error: "invalid json" }, 400); }
  const ip = String(body.ip || "").trim();
  if (!ip) return _json({ error: "ip required" }, 400);
  await env.BQ_USERS.delete(`sec:ban:${ip}`);
  await env.BQ_USERS.delete(`sec:rateviol:${ip}`);
  return _json({ ok: true, ip });
}

export async function handleSecurityHealth(request, env) {
  return _json({
    ok: true,
    ts: new Date().toISOString(),
    rate_limit_burst: RATE_LIMIT_BURST,
    rate_limit_window_s: RATE_LIMIT_WINDOW,
    auto_ban_seconds: BAN_DURATION_SECONDS,
    severe_ban_seconds: SEVERE_BAN_DURATION_SECONDS,
    probes_blocked: PROBE_PATHS.length,
    bad_ua_patterns: BAD_UA_PATTERNS.length,
    has_alerting: !!(env.TELEGRAM_BOT_TOKEN && env.MOSHE_CHAT_ID),
  });
}
