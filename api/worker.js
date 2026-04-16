// ── BQ Tools API Worker ──
// Cloudflare Worker that proxies AI calls, manages credits, auth, and admin.

export default {
  // ── Cron Trigger: daily news refresh ──
  async scheduled(event, env, ctx) {
    ctx.waitUntil(refreshNews(env));
  },

  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return corsResponse(env, new Response(null, { status: 204 }));
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // ── Routes ──
      if (path === '/api/auth/register' && request.method === 'POST') {
        return corsResponse(env, await handleRegister(request, env));
      }
      if (path === '/api/auth/verify' && request.method === 'POST') {
        return corsResponse(env, await handleVerify(request, env));
      }
      if (path === '/api/auth/google' && request.method === 'POST') {
        return corsResponse(env, await handleGoogleAuth(request, env));
      }
      if (path === '/api/user' && request.method === 'GET') {
        return corsResponse(env, await handleGetUser(request, env));
      }
      if (path === '/api/user/update' && request.method === 'POST') {
        return corsResponse(env, await handleUpdateUser(request, env));
      }
      if (path === '/api/ai' && request.method === 'POST') {
        return corsResponse(env, await handleAI(request, env));
      }
      if (path === '/api/ai/chat' && request.method === 'POST') {
        return corsResponse(env, await handleAIChat(request, env));
      }
      if (path === '/api/social/analyze' && request.method === 'POST') {
        return corsResponse(env, await handleSocialAnalyze(request, env));
      }
      if (path === '/api/credits/redeem' && request.method === 'POST') {
        return corsResponse(env, await handleRedeemCode(request, env));
      }
      if (path === '/api/admin/create-giftcode' && request.method === 'POST') {
        return corsResponse(env, await handleAdminCreateGiftCode(request, env));
      }
      if (path === '/api/affiliate/register' && request.method === 'POST') {
        return corsResponse(env, await handleAffiliateRegister(request, env));
      }
      if (path === '/api/affiliate/stats' && request.method === 'GET') {
        return corsResponse(env, await handleAffiliateStats(request, env));
      }
      if (path === '/api/admin/scrape-directory' && request.method === 'POST') {
        return corsResponse(env, await handleAdminScrapeDirectory(request, env));
      }
      if (path === '/api/credits/add' && request.method === 'POST') {
        return corsResponse(env, await handleAddCredits(request, env));
      }
      if (path === '/api/admin/users' && request.method === 'GET') {
        return corsResponse(env, await handleAdminUsers(request, env));
      }
      if (path === '/api/admin/user' && request.method === 'GET') {
        return corsResponse(env, await handleAdminGetUser(request, env));
      }
      if (path === '/api/admin/toggle-pro' && request.method === 'POST') {
        return corsResponse(env, await handleAdminTogglePro(request, env));
      }
      if (path === '/api/error-report' && request.method === 'POST') {
        return corsResponse(env, await handleErrorReport(request, env));
      }
      if (path === '/api/admin/errors' && request.method === 'GET') {
        return corsResponse(env, await handleAdminErrors(request, env));
      }
      if (path === '/api/projects' && request.method === 'GET') {
        return corsResponse(env, await handleGetProjects(request, env));
      }
      if (path === '/api/projects' && request.method === 'POST') {
        return corsResponse(env, await handleSaveProject(request, env));
      }
      if (path === '/api/credits/history' && request.method === 'GET') {
        return corsResponse(env, await handleGetCreditHistory(request, env));
      }
      if (path === '/api/monthly-tip' && request.method === 'GET') {
        return corsResponse(env, await handleMonthlyTip(request, env));
      }
      // ── Directory Routes ──
      if (path === '/api/directory/update' && request.method === 'POST') {
        return corsResponse(env, await handleDirectoryUpdate(request, env));
      }
      if (path === '/api/directory/list' && request.method === 'GET') {
        return corsResponse(env, await handleDirectoryList(request, env));
      }
      if (path === '/api/directory/profile' && request.method === 'GET') {
        return corsResponse(env, await handleDirectoryProfile(request, env));
      }
      if (path === '/api/directory/location' && request.method === 'POST') {
        return corsResponse(env, await handleDirectoryLocation(request, env));
      }
      if (path === '/api/admin/directory-tier' && request.method === 'POST') {
        return corsResponse(env, await handleAdminDirectoryTier(request, env));
      }

      if (path === '/api/waitlist/video' && request.method === 'POST') {
        return corsResponse(env, await handleVideoWaitlist(request, env));
      }
      if (path === '/api/referral/stats' && request.method === 'GET') {
        return corsResponse(env, await handleReferralStats(request, env));
      }
      if (path === '/api/referral/link' && request.method === 'GET') {
        return corsResponse(env, await handleReferralLink(request, env));
      }

      // ── Memory Routes ──
      if (path === '/api/memories' && request.method === 'GET') {
        return corsResponse(env, await handleGetMemories(request, env));
      }
      if (path === '/api/memories' && request.method === 'POST') {
        return corsResponse(env, await handleSaveMemory(request, env));
      }
      if (path.startsWith('/api/memories/') && request.method === 'PUT') {
        return corsResponse(env, await handleUpdateMemory(request, env, path));
      }
      if (path.startsWith('/api/memories/') && request.method === 'DELETE') {
        return corsResponse(env, await handleDeleteMemory(request, env, path));
      }
      if (path === '/api/memories/generate' && request.method === 'POST') {
        return corsResponse(env, await handleGenerateMemories(request, env));
      }

      // ── Training Routes ──
      if (path === '/api/training' && request.method === 'GET') {
        return corsResponse(env, await handleTrainingList(request, env));
      }
      if (path === '/api/training/upload' && request.method === 'POST') {
        return corsResponse(env, await handleTrainingUpload(request, env));
      }
      if (path.startsWith('/api/training/') && request.method === 'DELETE') {
        return corsResponse(env, await handleTrainingDelete(request, env, path));
      }
      if (path === '/api/training/knowledge' && request.method === 'GET') {
        return corsResponse(env, await handleTrainingKnowledge(request, env));
      }

      // ── Quote Routes ──
      if (path === '/api/quotes' && request.method === 'GET') {
        return corsResponse(env, await handleQuoteList(request, env));
      }
      if (path === '/api/quotes' && request.method === 'POST') {
        return corsResponse(env, await handleQuoteSave(request, env));
      }
      if (path === '/api/quotes/generate' && request.method === 'POST') {
        return corsResponse(env, await handleQuoteGenerate(request, env));
      }
      if (path.startsWith('/api/quotes/') && request.method === 'PUT') {
        return corsResponse(env, await handleQuoteUpdate(request, env, path));
      }
      if (path.startsWith('/api/quotes/') && request.method === 'DELETE') {
        return corsResponse(env, await handleQuoteDelete(request, env, path));
      }
      if (path.startsWith('/api/quotes/') && request.method === 'GET') {
        return corsResponse(env, await handleQuoteGet(request, env, path));
      }

      // ── Contract Routes ──
      if (path === '/api/contracts/generate' && request.method === 'POST') {
        return corsResponse(env, await handleContractGenerate(request, env));
      }

      // ── News Routes ──
      if (path === '/api/news/today' && request.method === 'GET') {
        return corsResponse(env, await handleNewsToday(request, env));
      }
      if (path === '/api/news/archive' && request.method === 'GET') {
        return corsResponse(env, await handleNewsArchive(request, env));
      }
      if (path === '/api/admin/news/refresh' && request.method === 'POST') {
        return corsResponse(env, await handleAdminNewsRefresh(request, env));
      }

      // ── Business Operations Suite ──
      // Generic CRUD for: receipts, clients, expenses, bprojects, suppliers, equipment, timelogs, compliance
      const businessMatch = path.match(/^\/api\/(receipts|clients|expenses|bprojects|suppliers|equipment|timelogs|compliance|invoices|taxes|doorknockers|doorbookings|jobs|workers)(\/[^\/]+)?$/);
      if (businessMatch) {
        const collection = businessMatch[1];
        const itemId = businessMatch[2] ? businessMatch[2].slice(1) : null;
        return corsResponse(env, await handleBusinessCRUD(request, env, collection, itemId));
      }
      if (path === '/api/receipts/extract' && request.method === 'POST') {
        return corsResponse(env, await handleReceiptExtract(request, env));
      }

      // ── Content Intelligence ──
      if (path === '/api/content/scan' && request.method === 'POST') {
        return corsResponse(env, await handleContentScan(request, env));
      }
      if (path === '/api/content/moodboard' && request.method === 'GET') {
        return corsResponse(env, await handleMoodboardList(request, env));
      }
      if (path === '/api/content/save' && request.method === 'POST') {
        return corsResponse(env, await handleMoodboardSave(request, env));
      }
      if (path.startsWith('/api/content/moodboard/') && request.method === 'DELETE') {
        return corsResponse(env, await handleMoodboardDelete(request, env, path));
      }

      // ── Video Downloader ──
      if (path === '/api/downloader/get' && request.method === 'POST') {
        return corsResponse(env, await handleVideoDownload(request, env));
      }

      if (path === '/api/health') {
        return corsResponse(env, json({ ok: true, ts: Date.now() }));
      }

      return corsResponse(env, json({ error: 'Not found' }, 404));
    } catch (err) {
      console.error('Worker error:', err);
      return corsResponse(env, json({ error: err.message || 'Internal error' }, 500));
    }
  }
};

// ── Helpers ──

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function corsResponse(env, response) {
  const origin = env.ALLOWED_ORIGIN || '*';
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');
  return new Response(response.body, {
    status: response.status,
    headers
  });
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateToken() {
  return crypto.randomUUID();
}

// Get user from token
async function getUserByToken(token, env) {
  if (!token) return null;
  const email = await env.BQ_USERS.get(`token:${token}`);
  if (!email) return null;
  const raw = await env.BQ_USERS.get(`user:${email}`);
  if (!raw) return null;
  return JSON.parse(raw);
}

// Check and reset monthly credits if needed
function checkMonthlyReset(user) {
  if (!user.isPro || !user.resetDate) return user;
  const now = new Date();
  const reset = new Date(user.resetDate);
  if (now >= reset) {
    user.credits = 50;
    user.creditsUsedThisMonth = 0;
    // Set next reset date to same day next month
    const next = new Date(reset);
    next.setMonth(next.getMonth() + 1);
    user.resetDate = next.toISOString();
  }
  return user;
}

// Rate limit check: max 10 requests per minute per user
async function checkRateLimit(email, env) {
  const now = Math.floor(Date.now() / 60000); // minute bucket
  const key = `rate:${email}:${now}`;
  const count = parseInt(await env.BQ_USERS.get(key) || '0');
  if (count >= 10) return false;
  await env.BQ_USERS.put(key, String(count + 1), { expirationTtl: 120 });
  return true;
}

// Admin auth check
function isAdmin(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const password = auth.replace('Bearer ', '');
  return password === (env.ADMIN_PASSWORD || 'bqadmin2026');
}

// ── Auth Routes ──

async function handleRegister(request, env) {
  const { email } = await request.json();
  if (!email || !email.includes('@')) {
    return json({ error: 'Valid email required' }, 400);
  }

  const emailLower = email.toLowerCase().trim();
  const code = generateCode();

  // Store verification code (expires in 10 min)
  await env.BQ_USERS.put(`verify:${emailLower}`, code, { expirationTtl: 600 });

  // Check if user already exists
  const existing = await env.BQ_USERS.get(`user:${emailLower}`);

  // MVP: return code on screen (Phase 2: send via email)
  return json({
    ok: true,
    code, // REMOVE THIS IN PRODUCTION — show on screen for MVP only
    isNew: !existing,
    message: `Your verification code is: ${code}`
  });
}

async function handleVerify(request, env) {
  const { email, code, referredBy } = await request.json();
  if (!email || !code) return json({ error: 'Email and code required' }, 400);

  const emailLower = email.toLowerCase().trim();
  const stored = await env.BQ_USERS.get(`verify:${emailLower}`);

  if (!stored || stored !== code.trim()) {
    return json({ error: 'Invalid or expired code' }, 401);
  }

  // Delete used code
  await env.BQ_USERS.delete(`verify:${emailLower}`);

  // Check if user exists
  let user = null;
  const existing = await env.BQ_USERS.get(`user:${emailLower}`);

  if (existing) {
    user = JSON.parse(existing);
    // Generate new token
    const newToken = generateToken();
    // Delete old token mapping
    if (user.userToken) {
      await env.BQ_USERS.delete(`token:${user.userToken}`);
    }
    user.userToken = newToken;
    user.lastLogin = new Date().toISOString();
    user = checkMonthlyReset(user);
  } else {
    // New user
    const token = generateToken();
    const baseFree = parseInt(env.FREE_CREDITS || '5');
    // Referral bonus: 10 credits instead of 5
    const refEmail = (referredBy || '').toLowerCase().trim();
    const hasReferral = refEmail && refEmail.includes('@') && refEmail !== emailLower;
    const freeCredits = hasReferral ? baseFree + 5 : baseFree;

    user = {
      email: emailLower,
      userToken: token,
      credits: freeCredits,
      isPro: false,
      creditsUsedThisMonth: 0,
      createdAt: new Date().toISOString(),
      resetDate: null,
      businessName: '',
      phone: '',
      logo: '',
      businessType: '',
      language: 'en',
      lastLogin: new Date().toISOString(),
      isNew: true,
      referredBy: hasReferral ? refEmail : '',
      referralSource: (referredBy === 'bqprod') ? 'bqprod' : ''
    };

    // Track referral for the referrer
    if (hasReferral) {
      const refKey = `referrals:${refEmail}`;
      const refRaw = await env.BQ_USERS.get(refKey);
      const refs = refRaw ? JSON.parse(refRaw) : [];
      refs.push({ email: emailLower, date: new Date().toISOString() });
      await env.BQ_USERS.put(refKey, JSON.stringify(refs));
    }
  }

  // Save user + token mapping
  await env.BQ_USERS.put(`user:${emailLower}`, JSON.stringify(user));
  await env.BQ_USERS.put(`token:${user.userToken}`, emailLower);

  return json({
    ok: true,
    userToken: user.userToken,
    user: sanitizeUser(user)
  });
}

// ── Google Auth ──

async function handleGoogleAuth(request, env) {
  const { credential } = await request.json();
  if (!credential) return json({ error: 'credential required' }, 400);

  // Verify JWT with Google
  let payload;
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!res.ok) throw new Error('Invalid token');
    payload = await res.json();
  } catch {
    return json({ error: 'Invalid Google credential' }, 401);
  }

  const email = (payload.email || '').toLowerCase().trim();
  if (!email) return json({ error: 'No email in Google token' }, 400);

  // Check if user exists
  const existing = await env.BQ_USERS.get(`user:${email}`);
  let user;

  if (existing) {
    user = JSON.parse(existing);
    // Generate new token
    const newToken = generateToken();
    if (user.userToken) {
      await env.BQ_USERS.delete(`token:${user.userToken}`);
    }
    user.userToken = newToken;
    user.lastLogin = new Date().toISOString();
    // Update name/picture from Google if not set
    if (!user.businessName && payload.name) user.businessName = payload.name;
    if (!user.picture && payload.picture) user.picture = payload.picture;
    user = checkMonthlyReset(user);
  } else {
    // New user
    const token = generateToken();
    const freeCredits = parseInt(env.FREE_CREDITS || '5');
    user = {
      email,
      userToken: token,
      credits: freeCredits,
      isPro: false,
      creditsUsedThisMonth: 0,
      createdAt: new Date().toISOString(),
      resetDate: null,
      businessName: payload.name || '',
      phone: '',
      logo: '',
      picture: payload.picture || '',
      businessType: '',
      language: 'en',
      lastLogin: new Date().toISOString(),
      isNew: true,
      authMethod: 'google'
    };
  }

  await env.BQ_USERS.put(`user:${email}`, JSON.stringify(user));
  await env.BQ_USERS.put(`token:${user.userToken}`, email);

  return json({
    ok: true,
    userToken: user.userToken,
    user: sanitizeUser(user)
  });
}

// ── Video Waitlist ──

async function handleVideoWaitlist(request, env) {
  const { email } = await request.json();
  if (!email || !email.includes('@')) return json({ error: 'Valid email required' }, 400);

  const emailLower = email.toLowerCase().trim();
  await env.BQ_USERS.put(`waitlist:video:${emailLower}`, JSON.stringify({
    email: emailLower,
    joinedAt: new Date().toISOString()
  }));

  return json({ ok: true });
}

function sanitizeUser(user) {
  // Return user data safe for client (no internal fields)
  return {
    email: user.email,
    credits: user.credits,
    isPro: user.isPro,
    creditsUsedThisMonth: user.creditsUsedThisMonth,
    createdAt: user.createdAt,
    resetDate: user.resetDate,
    businessName: user.businessName,
    phone: user.phone,
    logo: user.logo,
    businessType: user.businessType,
    language: user.language,
    isNew: user.isNew || false
  };
}

// ── User Routes ──

async function handleGetUser(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const updated = checkMonthlyReset(user);
  if (updated !== user) {
    await env.BQ_USERS.put(`user:${updated.email}`, JSON.stringify(updated));
  }

  return json({ ok: true, user: sanitizeUser(updated) });
}

async function handleUpdateUser(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const updates = await request.json();

  // Only allow updating these fields
  const allowed = ['businessName', 'phone', 'logo', 'businessType', 'language'];
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      // Logo size check
      if (key === 'logo' && updates[key] && updates[key].length > 70000) {
        return json({ error: 'Logo too large. Max 50KB.' }, 400);
      }
      user[key] = updates[key];
    }
  }

  // Clear isNew flag after profile setup
  if (updates.businessName) {
    user.isNew = false;
  }

  await env.BQ_USERS.put(`user:${user.email}`, JSON.stringify(user));
  return json({ ok: true, user: sanitizeUser(user) });
}

// ── AI Proxy ──

async function handleAI(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  // Rate limit
  if (!(await checkRateLimit(user.email, env))) {
    return json({ error: 'Rate limit exceeded. Max 10 requests per minute.' }, 429);
  }

  // Check credits
  const updated = checkMonthlyReset(user);
  if (updated.credits <= 0) {
    return json({ error: 'No credits remaining', credits: 0 }, 402);
  }

  const body = await request.json();
  const { action, images, prompt } = body;

  if (!action || !prompt) {
    return json({ error: 'action and prompt required' }, 400);
  }

  // Inject personal knowledge base for estimate/quote/report actions
  let finalPrompt = prompt;
  if (action === 'estimate' || action === 'report') {
    const knowledge = await buildKnowledgeBase(updated.email, env);
    if (knowledge.trained) {
      const context = `IMPORTANT — Use THIS CONTRACTOR'S actual pricing profile (learned from their past contracts/invoices):
${knowledge.summary || ''}
Materials they use: ${JSON.stringify(knowledge.materials || [])}
Their labor rates: ${JSON.stringify(knowledge.labor || [])}
Typical markup: ${knowledge.markupRange || 'standard'}
Common project types: ${(knowledge.projectTypes || []).join(', ')}

Use THESE rates whenever possible. If this project isn't covered by their history, use market-typical LA pricing.

---

`;
      finalPrompt = context + prompt;
    }
  }

  let aiResponse;
  try {
    // Try Claude first
    aiResponse = await callClaudeAPI(env, finalPrompt, images || []);
  } catch (claudeErr) {
    console.error('Claude error, trying Gemini:', claudeErr.message);
    try {
      aiResponse = await callGeminiAPI(env, finalPrompt, images || []);
    } catch (geminiErr) {
      console.error('Gemini also failed:', geminiErr.message);
      return json({ error: `AI failed: ${claudeErr.message}` }, 502);
    }
  }

  // Deduct credit
  updated.credits -= 1;
  updated.creditsUsedThisMonth = (updated.creditsUsedThisMonth || 0) + 1;
  await env.BQ_USERS.put(`user:${updated.email}`, JSON.stringify(updated));

  // Log credit usage
  await logCreditUsage(updated.email, action, body.projectTitle || action, env);

  return json({
    ok: true,
    result: aiResponse,
    credits: updated.credits
  });
}

// ── Multi-Model Chat ──

const MODEL_MAP = {
  // Claude
  'claude-haiku': { type: 'claude', model: 'claude-3-5-haiku-20241022', cost: 1 },
  'claude-sonnet': { type: 'claude', model: 'claude-sonnet-4-20250514', cost: 3 },
  // Gemini
  'gemini-flash': { type: 'gemini', model: 'gemini-2.5-flash', cost: 1 },
  'gemini-pro': { type: 'gemini', model: 'gemini-2.0-flash', cost: 3 },
  // OpenAI
  'gpt-4o-mini': { type: 'openai', model: 'gpt-4o-mini', cost: 1 },
  'gpt-4o': { type: 'openai', model: 'gpt-4o', cost: 3 },
  // Groq
  'llama-3.3-70b': { type: 'groq', model: 'llama-3.3-70b-versatile', cost: 1 },
  'mixtral-8x7b': { type: 'groq', model: 'mixtral-8x7b-32768', cost: 1 },
  // Manus
  'manus': { type: 'manus', model: 'manus', cost: 5 },
};

async function handleAIChat(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  if (!(await checkRateLimit(user.email, env))) {
    return json({ error: 'Rate limit exceeded' }, 429);
  }

  const updated = checkMonthlyReset(user);
  const body = await request.json();
  const { model, messages, images } = body;

  if (!model || !messages || !messages.length) {
    return json({ error: 'model and messages required' }, 400);
  }

  const modelConf = MODEL_MAP[model];
  if (!modelConf) return json({ error: `Unknown model: ${model}` }, 400);

  if (updated.credits < modelConf.cost) {
    return json({ error: 'Not enough credits', credits: updated.credits, cost: modelConf.cost }, 402);
  }

  // Build prompt from messages array
  const lastMsg = messages[messages.length - 1];
  // Extract system prompt if present
  const systemMsg = messages.find(m => m.role === 'system');
  const chatMessages = messages.filter(m => m.role !== 'system');
  const prompt = (systemMsg ? 'System: ' + systemMsg.content + '\n\n' : '') +
    chatMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');

  let aiResponse;
  try {
    if (modelConf.type === 'claude') {
      aiResponse = await callClaudeWithModel(env, modelConf.model, prompt, images || []);
    } else if (modelConf.type === 'gemini') {
      aiResponse = await callGeminiWithModel(env, modelConf.model, prompt, images || []);
    } else if (modelConf.type === 'openai') {
      aiResponse = await callOpenAIWithModel(env, modelConf.model, prompt, images || []);
    } else if (modelConf.type === 'groq') {
      aiResponse = await callGroqWithModel(env, modelConf.model, prompt, images || []);
    } else if (modelConf.type === 'manus') {
      aiResponse = await callManusWithModel(env, modelConf.model, prompt, images || []);
    } else {
      throw new Error('Unknown provider: ' + modelConf.type);
    }
  } catch (err) {
    return json({ error: `AI failed: ${err.message}` }, 502);
  }

  updated.credits -= modelConf.cost;
  updated.creditsUsedThisMonth = (updated.creditsUsedThisMonth || 0) + modelConf.cost;
  await env.BQ_USERS.put(`user:${updated.email}`, JSON.stringify(updated));
  await logCreditUsage(updated.email, `chat:${model}`, lastMsg?.content?.substring(0, 50) || 'Chat', env);

  return json({ ok: true, result: aiResponse, model, credits: updated.credits });
}

async function callClaudeWithModel(env, model, prompt, images) {
  const apiKey = env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error('Claude API key not configured');

  const content = [];
  for (const img of images) {
    content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: img } });
  }
  content.push({ type: 'text', text: prompt });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: 2000, messages: [{ role: 'user', content }] })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.content?.map(c => c.text || '').join('') || '';
}

async function callGeminiWithModel(env, model, prompt, images) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key not configured');

  const parts = [];
  for (const img of images) {
    parts.push({ inline_data: { mime_type: 'image/jpeg', data: img } });
  }
  parts.push({ text: prompt });

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }] })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ── OpenAI ──
async function callOpenAIWithModel(env, model, prompt, images) {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const messages = [{ role: 'user', content: prompt }];
  // If images, use vision format
  if (images && images.length > 0) {
    const content = [];
    for (const img of images) {
      content.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${img}` } });
    }
    content.push({ type: 'text', text: prompt });
    messages[0].content = content;
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, max_tokens: 2000 })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.choices?.[0]?.message?.content || '';
}

// ── Groq ──
async function callGroqWithModel(env, model, prompt, images) {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Groq API key not configured');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 2000 })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.choices?.[0]?.message?.content || '';
}

// ── Manus ──
async function callManusWithModel(env, model, prompt, images) {
  const apiKey = env.MANUS_API_KEY;
  if (!apiKey) throw new Error('Manus API key not configured');

  const res = await fetch('https://api.manus.im/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 2000 })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.choices?.[0]?.message?.content || '';
}

async function callClaudeAPI(env, prompt, images) {
  const apiKey = env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error('Claude API key not configured');

  const model = env.CLAUDE_MODEL || 'claude-3-5-haiku-20241022';

  // Build content array
  const content = [];
  for (const img of images) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: img }
    });
  }
  content.push({ type: 'text', text: prompt });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      messages: [{ role: 'user', content }]
    })
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const text = data.content?.map(c => c.text || '').join('') || '';
  if (!text) throw new Error('Claude returned empty response');
  return text;
}

async function callGeminiAPI(env, prompt, images) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key not configured');

  const model = env.GEMINI_MODEL || 'gemini-2.5-flash';

  const parts = [];
  for (const img of images) {
    parts.push({ inline_data: { mime_type: 'image/jpeg', data: img } });
  }
  parts.push({ text: prompt });

  let res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }] })
    }
  );

  let data = await res.json();

  // Fallback to older model if primary fails
  if (data.error && env.GEMINI_MODEL_FALLBACK) {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL_FALLBACK}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] })
      }
    );
    data = await res.json();
  }

  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!text) throw new Error('Gemini returned empty response');
  return text;
}

// ── Credit Usage Logging ──

async function logCreditUsage(email, tool, projectTitle, env) {
  const key = `credits:${email}`;
  const raw = await env.BQ_USERS.get(key);
  const history = raw ? JSON.parse(raw) : [];

  history.unshift({
    date: new Date().toISOString(),
    tool,
    action: tool,
    creditCost: 1,
    projectTitle: projectTitle || tool
  });

  // Keep last 500 entries
  if (history.length > 500) history.length = 500;

  await env.BQ_USERS.put(key, JSON.stringify(history));
}

// ── Credits ──

async function handleAddCredits(request, env) {
  if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 403);

  const { email, amount, makePro } = await request.json();
  if (!email || !amount) return json({ error: 'email and amount required' }, 400);

  const emailLower = email.toLowerCase().trim();
  const raw = await env.BQ_USERS.get(`user:${emailLower}`);
  if (!raw) return json({ error: 'User not found' }, 404);

  const user = JSON.parse(raw);
  user.credits = (user.credits || 0) + parseInt(amount);

  if (makePro) {
    user.isPro = true;
    if (!user.resetDate) {
      const next = new Date();
      next.setMonth(next.getMonth() + 1);
      user.resetDate = next.toISOString();
    }
  }

  await env.BQ_USERS.put(`user:${emailLower}`, JSON.stringify(user));
  return json({ ok: true, credits: user.credits, isPro: user.isPro });
}

// ── Admin ──

async function handleAdminUsers(request, env) {
  if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 403);

  // List all users from KV (prefix scan)
  const list = await env.BQ_USERS.list({ prefix: 'user:' });
  const users = [];

  for (const key of list.keys) {
    const raw = await env.BQ_USERS.get(key.name);
    if (raw) {
      const u = JSON.parse(raw);
      users.push({
        email: u.email,
        credits: u.credits,
        isPro: u.isPro,
        businessName: u.businessName,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
        creditsUsedThisMonth: u.creditsUsedThisMonth
      });
    }
  }

  return json({ ok: true, users, count: users.length });
}

async function handleAdminGetUser(request, env) {
  if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 403);

  const url = new URL(request.url);
  const email = url.searchParams.get('email');
  if (!email) return json({ error: 'email param required' }, 400);

  const raw = await env.BQ_USERS.get(`user:${email.toLowerCase().trim()}`);
  if (!raw) return json({ error: 'User not found' }, 404);

  const user = JSON.parse(raw);

  // Also get their credit history
  const creditsRaw = await env.BQ_USERS.get(`credits:${user.email}`);
  const creditHistory = creditsRaw ? JSON.parse(creditsRaw) : [];

  // And project history
  const projectsRaw = await env.BQ_USERS.get(`projects:${user.email}`);
  const projects = projectsRaw ? JSON.parse(projectsRaw) : [];

  return json({ ok: true, user: sanitizeUser(user), creditHistory, projects });
}

async function handleAdminTogglePro(request, env) {
  if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 403);

  const { email } = await request.json();
  if (!email) return json({ error: 'email required' }, 400);

  const emailLower = email.toLowerCase().trim();
  const raw = await env.BQ_USERS.get(`user:${emailLower}`);
  if (!raw) return json({ error: 'User not found' }, 404);

  const user = JSON.parse(raw);
  user.isPro = !user.isPro;

  if (user.isPro) {
    user.credits = 50;
    user.creditsUsedThisMonth = 0;
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    user.resetDate = next.toISOString();
  }

  await env.BQ_USERS.put(`user:${emailLower}`, JSON.stringify(user));
  return json({ ok: true, isPro: user.isPro, credits: user.credits });
}

// ── Projects ──

async function handleGetProjects(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const raw = await env.BQ_USERS.get(`projects:${user.email}`);
  const projects = raw ? JSON.parse(raw) : [];
  return json({ ok: true, projects });
}

async function handleSaveProject(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const project = await request.json();
  const key = `projects:${user.email}`;
  const raw = await env.BQ_USERS.get(key);
  const projects = raw ? JSON.parse(raw) : [];

  projects.unshift({
    id: Date.now(),
    date: new Date().toISOString(),
    tool: project.tool || 'compare',
    title: project.title || 'Untitled',
    thumbnail: project.thumbnail || '', // 200px base64
    result_summary: project.result_summary || ''
  });

  // Keep last 200 projects
  if (projects.length > 200) projects.length = 200;

  await env.BQ_USERS.put(key, JSON.stringify(projects));
  return json({ ok: true, count: projects.length });
}

// ── Credit History ──

async function handleGetCreditHistory(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const raw = await env.BQ_USERS.get(`credits:${user.email}`);
  const history = raw ? JSON.parse(raw) : [];
  return json({ ok: true, history });
}

// ── Monthly Tip ──

async function handleMonthlyTip(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  // Check if we already have a recent tip
  const tipKey = `tip:${user.email}`;
  const existingTip = await env.BQ_USERS.get(tipKey);
  if (existingTip) {
    const tip = JSON.parse(existingTip);
    const tipDate = new Date(tip.date);
    const daysSince = (Date.now() - tipDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 30) {
      return json({ ok: true, tip: tip.text, cached: true });
    }
  }

  // Get credit history for analysis
  const creditsRaw = await env.BQ_USERS.get(`credits:${user.email}`);
  const history = creditsRaw ? JSON.parse(creditsRaw) : [];

  if (history.length === 0) {
    const defaultTip = "Welcome! Start with the Compare tool — it's free and helps you build your portfolio.";
    return json({ ok: true, tip: defaultTip, cached: false });
  }

  // Analyze usage
  const toolCounts = {};
  history.forEach(h => {
    toolCounts[h.tool] = (toolCounts[h.tool] || 0) + 1;
  });

  const topTool = Object.entries(toolCounts).sort((a, b) => b[1] - a[1])[0];
  const allTools = ['AI Analysis', 'Quick Report', 'Smart Estimate', 'Social Post', 'Review Request', 'Quick Sketch', 'AI Assistant'];
  const unused = allTools.filter(t => !toolCounts[t]);

  // Generate tip using AI (FREE — no credit cost)
  const tipPrompt = `You are BQ Assistant for contractors. Based on this usage data, give ONE short actionable tip (max 2 sentences):
- Most used: ${topTool[0]} (${topTool[1]} times)
- Total actions: ${history.length}
- Unused tools: ${unused.join(', ') || 'none'}
Respond with just the tip text, no quotes or prefix.`;

  let tipText;
  try {
    tipText = await callClaudeAPI(env, tipPrompt, []);
  } catch {
    tipText = unused.length > 0
      ? `You haven't tried ${unused[0]} yet — give it a shot!`
      : `Great usage! Your most-used tool is ${topTool[0]}. Keep building that portfolio!`;
  }

  await env.BQ_USERS.put(tipKey, JSON.stringify({ text: tipText, date: new Date().toISOString() }));
  return json({ ok: true, tip: tipText, cached: false });
}

// ── Error Reporting ──

async function handleErrorReport(request, env) {
  const body = await request.json();
  const key = `error:${Date.now()}`;
  await env.BQ_USERS.put(key, JSON.stringify({
    ...body,
    timestamp: new Date().toISOString()
  }), { expirationTtl: 2592000 }); // 30 days

  return json({ ok: true });
}

async function handleAdminErrors(request, env) {
  if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 403);

  const list = await env.BQ_USERS.list({ prefix: 'error:' });
  const errors = [];

  for (const key of list.keys) {
    const raw = await env.BQ_USERS.get(key.name);
    if (raw) errors.push(JSON.parse(raw));
  }

  return json({ ok: true, errors, count: errors.length });
}

// ── Directory ──

async function handleDirectoryUpdate(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const updates = await request.json();
  const key = `directory:${user.email}`;
  const raw = await env.BQ_USERS.get(key);
  const listing = raw ? JSON.parse(raw) : {
    email: user.email,
    businessName: user.businessName || '',
    type: user.businessType || '',
    phone: '',
    contactEmail: user.email,
    logo: user.logo || '',
    description: '',
    photos: [],
    reviews: [],
    locations: [],
    tier: 'free',
    whatsappGroup: '',
    website: '',
    facebook: '',
    instagram: '',
    youtube: '',
    licenseNumber: '',
    yearsInBusiness: '',
    createdAt: new Date().toISOString()
  };

  // Allowed fields
  const allowed = ['businessName', 'type', 'phone', 'contactEmail', 'logo', 'description', 'photos', 'reviews', 'whatsappGroup', 'website', 'facebook', 'instagram', 'youtube', 'licenseNumber', 'yearsInBusiness'];
  for (const k of allowed) {
    if (updates[k] !== undefined) {
      // Limit photos based on tier
      if (k === 'photos') {
        const maxPhotos = listing.tier === 'featured' ? 20 : (listing.tier === 'pro' ? 5 : 0);
        if (updates[k].length > maxPhotos) {
          return json({ error: `Max ${maxPhotos} photos for ${listing.tier} tier` }, 400);
        }
      }
      // Reviews only for pro+
      if (k === 'reviews' && listing.tier === 'free') {
        return json({ error: 'Reviews require Pro listing' }, 400);
      }
      // WhatsApp only for featured
      if (k === 'whatsappGroup' && listing.tier !== 'featured') {
        return json({ error: 'WhatsApp group requires Featured listing' }, 400);
      }
      listing[k] = updates[k];
    }
  }

  listing.updatedAt = new Date().toISOString();
  await env.BQ_USERS.put(key, JSON.stringify(listing));

  // Update index
  await updateDirectoryIndex(user.email, listing, env);

  return json({ ok: true, listing });
}

async function updateDirectoryIndex(email, listing, env) {
  const indexKey = 'directory:index';
  const raw = await env.BQ_USERS.get(indexKey);
  const index = raw ? JSON.parse(raw) : [];

  // Remove existing entry
  const filtered = index.filter(e => e.email !== email);

  // Add updated entry
  filtered.push({
    email: listing.email,
    businessName: listing.businessName,
    type: listing.type,
    tier: listing.tier,
    logo: listing.logo,
    phone: listing.phone,
    description: (listing.description || '').substring(0, 120),
    photoCount: (listing.photos || []).length,
    reviewCount: (listing.reviews || []).length,
    locationCount: (listing.locations || []).length,
    updatedAt: listing.updatedAt || listing.createdAt
  });

  await env.BQ_USERS.put(indexKey, JSON.stringify(filtered));
}

async function handleDirectoryList(request, env) {
  const url = new URL(request.url);
  const search = (url.searchParams.get('q') || '').toLowerCase();
  const typeFilter = url.searchParams.get('type') || '';

  const raw = await env.BQ_USERS.get('directory:index');
  let listings = raw ? JSON.parse(raw) : [];

  // Filter
  if (search) {
    listings = listings.filter(l =>
      (l.businessName || '').toLowerCase().includes(search) ||
      (l.type || '').toLowerCase().includes(search) ||
      (l.description || '').toLowerCase().includes(search)
    );
  }
  if (typeFilter) {
    listings = listings.filter(l => l.type === typeFilter);
  }

  // Sort: featured first, then pro, then free. Within each tier, by updatedAt desc
  const tierOrder = { featured: 0, pro: 1, free: 2 };
  listings.sort((a, b) => {
    const ta = tierOrder[a.tier] ?? 2;
    const tb = tierOrder[b.tier] ?? 2;
    if (ta !== tb) return ta - tb;
    return (b.updatedAt || '').localeCompare(a.updatedAt || '');
  });

  return json({ ok: true, listings, count: listings.length });
}

async function handleDirectoryProfile(request, env) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');
  if (!email) return json({ error: 'email param required' }, 400);

  const raw = await env.BQ_USERS.get(`directory:${email.toLowerCase().trim()}`);
  if (!raw) return json({ error: 'Listing not found' }, 404);

  const listing = JSON.parse(raw);

  // Strip sensitive data for free tier
  const result = { ...listing };
  if (listing.tier === 'free') {
    result.phone = '';
    result.contactEmail = '';
    result.logo = '';
    result.photos = [];
    result.reviews = [];
  }

  return json({ ok: true, listing: result });
}

async function handleDirectoryLocation(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const { address, projectTitle, thumbnail } = await request.json();
  if (!address) return json({ error: 'address required' }, 400);

  // Geocode with Nominatim (free, OSM)
  let lat = null, lng = null;
  try {
    const geo = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`, {
      headers: { 'User-Agent': 'BQTools/1.0' }
    });
    const results = await geo.json();
    if (results.length > 0) {
      lat = parseFloat(results[0].lat);
      lng = parseFloat(results[0].lon);
    }
  } catch (e) {
    console.error('Geocode failed:', e);
  }

  if (!lat || !lng) {
    return json({ error: 'Could not geocode address. Try a more specific address.' }, 400);
  }

  const key = `directory:${user.email}`;
  const raw = await env.BQ_USERS.get(key);
  if (!raw) return json({ error: 'Create listing first' }, 400);

  const listing = JSON.parse(raw);

  // Pro: 10 locations, Featured: 50, Free: 0
  const maxLoc = listing.tier === 'featured' ? 50 : (listing.tier === 'pro' ? 10 : 0);
  if (listing.tier === 'free') {
    return json({ error: 'Locations require Pro listing' }, 400);
  }
  if ((listing.locations || []).length >= maxLoc) {
    return json({ error: `Max ${maxLoc} locations for ${listing.tier} tier` }, 400);
  }

  if (!listing.locations) listing.locations = [];
  listing.locations.push({
    address,
    lat,
    lng,
    projectTitle: projectTitle || '',
    thumbnail: thumbnail || '',
    addedAt: new Date().toISOString()
  });

  listing.updatedAt = new Date().toISOString();
  await env.BQ_USERS.put(key, JSON.stringify(listing));
  await updateDirectoryIndex(user.email, listing, env);

  return json({ ok: true, location: listing.locations[listing.locations.length - 1] });
}

async function handleAdminDirectoryTier(request, env) {
  if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 403);

  const { email, tier } = await request.json();
  if (!email || !['free', 'pro', 'featured'].includes(tier)) {
    return json({ error: 'email and tier (free/pro/featured) required' }, 400);
  }

  const emailLower = email.toLowerCase().trim();
  const key = `directory:${emailLower}`;
  const raw = await env.BQ_USERS.get(key);
  if (!raw) return json({ error: 'Listing not found' }, 404);

  const listing = JSON.parse(raw);
  listing.tier = tier;
  listing.updatedAt = new Date().toISOString();

  await env.BQ_USERS.put(key, JSON.stringify(listing));
  await updateDirectoryIndex(emailLower, listing, env);

  return json({ ok: true, tier: listing.tier });
}

// ── Referral ──

async function handleReferralStats(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const refKey = `referrals:${user.email}`;
  const raw = await env.BQ_USERS.get(refKey);
  const refs = raw ? JSON.parse(raw) : [];

  return json({
    ok: true,
    referrals: refs.length,
    referralList: refs.slice(0, 20),
    hasDiscount: refs.length > 0
  });
}

async function handleReferralLink(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const origin = env.ALLOWED_ORIGIN || 'https://bq-tools.fanzai-mgmt.workers.dev';
  return json({
    ok: true,
    link: `${origin}/?ref=${encodeURIComponent(user.email)}`
  });
}

// ── Social Analysis (Apify + AI) ──

async function handleSocialAnalyze(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  if (!(await checkRateLimit(user.email, env))) {
    return json({ error: 'Rate limit exceeded' }, 429);
  }

  const updated = checkMonthlyReset(user);
  if (updated.credits < 2) {
    return json({ error: 'Need 2 credits', credits: updated.credits }, 402);
  }

  const { platform, username, context } = await request.json();
  if (!username) return json({ error: 'username required' }, 400);

  const apifyToken = env.APIFY_TOKEN;
  if (!apifyToken) return json({ error: 'Apify not configured' }, 500);

  // Clean username
  const cleanUser = username.replace(/^@/, '').replace(/^https?:\/\/(www\.)?(instagram|facebook)\.com\//, '').replace(/\/$/, '').split('?')[0];

  let profileData = null;

  if (platform === 'instagram') {
    try {
      // Start Apify Instagram scraper
      const runRes = await fetch(`https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs?token=${apifyToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernames: [cleanUser],
          resultsLimit: 12
        })
      });
      const runData = await runRes.json();
      const runId = runData.data?.id;
      if (!runId) throw new Error('Failed to start scraper');

      // Poll for results (max 30 seconds)
      let attempts = 0;
      while (attempts < 15) {
        await new Promise(r => setTimeout(r, 2000));
        const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`);
        const statusData = await statusRes.json();
        if (statusData.data?.status === 'SUCCEEDED') break;
        if (statusData.data?.status === 'FAILED' || statusData.data?.status === 'ABORTED') {
          throw new Error('Scraper failed');
        }
        attempts++;
      }

      // Get results
      const dataRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apifyToken}`);
      const items = await dataRes.json();
      if (items.length > 0) {
        profileData = items[0];
      }
    } catch (e) {
      console.error('Apify error:', e);
      // Fall back to AI-only analysis
    }
  }

  // Build analysis prompt
  let dataSection = '';
  if (profileData) {
    dataSection = `
REAL INSTAGRAM DATA:
- Username: ${profileData.username || cleanUser}
- Full Name: ${profileData.fullName || 'N/A'}
- Bio: ${profileData.biography || 'N/A'}
- Followers: ${profileData.followersCount || 0}
- Following: ${profileData.followsCount || 0}
- Posts: ${profileData.postsCount || 0}
- Profile Pic: ${profileData.profilePicUrl ? 'Yes' : 'No'}
- Is Business: ${profileData.isBusinessAccount || false}
- Is Verified: ${profileData.verified || false}
- External URL: ${profileData.externalUrl || 'None'}
- Recent posts engagement: ${JSON.stringify((profileData.latestPosts || []).slice(0, 6).map(p => ({
      likes: p.likesCount, comments: p.commentsCount, type: p.type
    })))}

Analyze this REAL data. Use actual numbers, not estimates.`;
  } else {
    dataSection = `
Profile: @${cleanUser} on ${platform || 'instagram'}
(Could not scrape live data — analyze based on best practices for contractor accounts)`;
  }

  const prompt = `You are an expert social media analyst for construction/remodeling businesses.

${dataSection}
Business context: ${context || 'contractor/remodeler'}

Provide a detailed analysis. Respond JSON only:
{
  "profile_name": "@${cleanUser}",
  "followers": ${profileData?.followersCount || 'null'},
  "following": ${profileData?.followsCount || 'null'},
  "posts_count": ${profileData?.postsCount || 'null'},
  "bio_text": ${JSON.stringify(profileData?.biography || '')},
  "overall_score": 1-100,
  "bio_score": 1-10,
  "content_score": 1-10,
  "engagement_score": 1-10,
  "consistency_score": 1-10,
  "hashtag_score": 1-10,
  "engagement_rate": "X.X%",
  "post_frequency": "X posts/week",
  "content_breakdown": {"before_after":20,"project_photos":30,"videos_reels":15,"testimonials":5,"behind_scenes":10,"educational":10,"other":10},
  "strengths": ["str1","str2"],
  "weaknesses": ["weak1","weak2"],
  "recommendations": [{"title":"title","description":"desc","priority":"high/medium/low"}],
  "quick_wins": ["win1","win2","win3"],
  "competitor_tip": "one sentence"
}`;

  let aiResponse;
  try {
    aiResponse = await callClaudeAPI(env, prompt, []);
  } catch (e) {
    try {
      aiResponse = await callGeminiAPI(env, prompt, []);
    } catch (e2) {
      return json({ error: 'AI analysis failed: ' + e.message }, 502);
    }
  }

  // Deduct 2 credits
  updated.credits -= 2;
  updated.creditsUsedThisMonth = (updated.creditsUsedThisMonth || 0) + 2;
  await env.BQ_USERS.put(`user:${updated.email}`, JSON.stringify(updated));
  await logCreditUsage(updated.email, 'social-analysis', '@' + cleanUser, env);

  // Parse AI response
  let analysis;
  try {
    analysis = JSON.parse(aiResponse.replace(/```json|```/g, '').trim());
  } catch {
    analysis = { raw: aiResponse };
  }

  return json({
    ok: true,
    analysis,
    profileData: profileData ? {
      username: profileData.username,
      fullName: profileData.fullName,
      biography: profileData.biography,
      followersCount: profileData.followersCount,
      followsCount: profileData.followsCount,
      postsCount: profileData.postsCount,
      profilePicUrl: profileData.profilePicUrl,
      isBusinessAccount: profileData.isBusinessAccount,
      verified: profileData.verified,
      externalUrl: profileData.externalUrl
    } : null,
    credits: updated.credits
  });
}

// ── Google Maps Directory Scraper (Admin only) ──

async function handleAdminScrapeDirectory(request, env) {
  if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 403);

  const apifyToken = env.APIFY_TOKEN;
  if (!apifyToken) return json({ error: 'Apify not configured' }, 500);

  const { query, maxResults } = await request.json();
  if (!query) return json({ error: 'query required' }, 400);
  const max = Math.min(Math.max(parseInt(maxResults) || 20, 5), 100);

  // Start Google Maps scraper
  let runId;
  try {
    const runRes = await fetch(`https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${apifyToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchStringsArray: [query],
        maxCrawledPlaces: max,
        language: 'en',
        maxReviews: 0,
        maxImages: 0
      })
    });
    const runData = await runRes.json();
    runId = runData.data?.id;
    if (!runId) throw new Error('Failed to start scraper: ' + JSON.stringify(runData));
  } catch (e) {
    return json({ error: 'Scraper start failed: ' + e.message }, 502);
  }

  // Poll for results (max 60 seconds)
  let attempts = 0;
  while (attempts < 30) {
    await new Promise(r => setTimeout(r, 2000));
    const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`);
    const statusData = await statusRes.json();
    const status = statusData.data?.status;
    if (status === 'SUCCEEDED') break;
    if (status === 'FAILED' || status === 'ABORTED') {
      return json({ error: 'Scraper failed: ' + status }, 502);
    }
    attempts++;
  }

  // Get results
  const dataRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apifyToken}`);
  const items = await dataRes.json();

  // Import each result as a free directory listing
  let imported = 0;
  const skipped = [];

  for (const item of items) {
    if (!item.title) continue;

    // Generate a fake email key from business name (no real email)
    const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 40);
    const fakeEmail = `maps-${slug}@directory.bqtools`;

    // Check if already exists
    const existing = await env.BQ_USERS.get(`directory:${fakeEmail}`);
    if (existing) { skipped.push(item.title); continue; }

    // Guess business type from category
    const cat = (item.categoryName || '').toLowerCase();
    let bizType = 'Other';
    if (cat.includes('general contractor') || cat.includes('contractor')) bizType = 'General Contractor';
    else if (cat.includes('remodel')) bizType = 'Remodeler';
    else if (cat.includes('paint')) bizType = 'Painter';
    else if (cat.includes('roof')) bizType = 'Roofer';
    else if (cat.includes('landscape') || cat.includes('lawn')) bizType = 'Landscaper';
    else if (cat.includes('interior') || cat.includes('design')) bizType = 'Interior Designer';
    else if (cat.includes('plumb')) bizType = 'Other';
    else if (cat.includes('electric')) bizType = 'Other';

    const listing = {
      email: fakeEmail,
      businessName: item.title,
      type: bizType,
      phone: item.phone || '',
      contactEmail: '',
      logo: '',
      description: (item.categoryName || '') + (item.address ? ' — ' + item.address : ''),
      photos: [],
      reviews: [],
      locations: [],
      tier: 'free',
      whatsappGroup: '',
      website: item.website || '',
      facebook: '',
      instagram: '',
      youtube: '',
      licenseNumber: '',
      yearsInBusiness: '',
      rating: item.totalScore || 0,
      reviewCount: item.reviewsCount || 0,
      scrapedFrom: 'google-maps',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add location if coordinates available
    if (item.location?.lat && item.location?.lng) {
      listing.locations.push({
        address: item.address || query,
        lat: item.location.lat,
        lng: item.location.lng,
        projectTitle: '',
        thumbnail: '',
        addedAt: new Date().toISOString()
      });
    }

    await env.BQ_USERS.put(`directory:${fakeEmail}`, JSON.stringify(listing));
    await updateDirectoryIndex(fakeEmail, listing, env);
    imported++;
  }

  return json({
    ok: true,
    query,
    total: items.length,
    imported,
    skipped: skipped.length,
    skippedNames: skipped.slice(0, 10)
  });
}

// ── Memories ──

async function handleGetMemories(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const raw = await env.BQ_USERS.get(`memories:${user.email}`);
  const memories = raw ? JSON.parse(raw) : [];
  return json({ ok: true, memories });
}

async function handleSaveMemory(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const memory = await request.json();
  const key = `memories:${user.email}`;
  const raw = await env.BQ_USERS.get(key);
  const memories = raw ? JSON.parse(raw) : [];

  memories.push({
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    content: memory.content || '',
    category: memory.category || 'General',
    importance: Math.min(5, Math.max(1, parseInt(memory.importance) || 3)),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  if (memories.length > 200) memories.splice(0, memories.length - 200);
  await env.BQ_USERS.put(key, JSON.stringify(memories));
  return json({ ok: true, count: memories.length });
}

async function handleUpdateMemory(request, env, path) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const memId = path.split('/').pop();
  const updates = await request.json();
  const key = `memories:${user.email}`;
  const raw = await env.BQ_USERS.get(key);
  const memories = raw ? JSON.parse(raw) : [];

  const idx = memories.findIndex(m => m.id === memId);
  if (idx === -1) return json({ error: 'Memory not found' }, 404);

  if (updates.content !== undefined) memories[idx].content = updates.content;
  if (updates.category !== undefined) memories[idx].category = updates.category;
  if (updates.importance !== undefined) memories[idx].importance = Math.min(5, Math.max(1, parseInt(updates.importance) || 3));
  memories[idx].updatedAt = new Date().toISOString();

  await env.BQ_USERS.put(key, JSON.stringify(memories));
  return json({ ok: true, memory: memories[idx] });
}

async function handleDeleteMemory(request, env, path) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const memId = path.split('/').pop();
  const key = `memories:${user.email}`;
  const raw = await env.BQ_USERS.get(key);
  const memories = raw ? JSON.parse(raw) : [];

  const filtered = memories.filter(m => m.id !== memId);
  if (filtered.length === memories.length) return json({ error: 'Memory not found' }, 404);

  await env.BQ_USERS.put(key, JSON.stringify(filtered));
  return json({ ok: true, count: filtered.length });
}

async function handleGenerateMemories(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  if (!(await checkRateLimit(user.email, env))) {
    return json({ error: 'Rate limit exceeded' }, 429);
  }

  const updated = checkMonthlyReset(user);
  if (updated.credits < 1) {
    return json({ error: 'Need 1 credit', credits: updated.credits }, 402);
  }

  // Get existing data
  const creditsRaw = await env.BQ_USERS.get(`credits:${user.email}`);
  const history = creditsRaw ? JSON.parse(creditsRaw) : [];
  const memRaw = await env.BQ_USERS.get(`memories:${user.email}`);
  const existing = memRaw ? JSON.parse(memRaw) : [];

  const prompt = `Based on this user data, generate 3-5 useful memories (facts) about this user that would help personalize future AI interactions.
User profile: ${JSON.stringify({ businessName: user.businessName, businessType: user.businessType, language: user.language })}
Recent tool usage: ${JSON.stringify(history.slice(0, 20).map(h => h.tool + ': ' + h.projectTitle))}
Existing memories: ${JSON.stringify(existing.map(m => m.content))}

Respond with JSON array only: [{"content":"...", "category":"Address|Contact|Preferences|Business|Tools|Projects", "importance":1-5}]
Do NOT duplicate existing memories. Focus on patterns and preferences.`;

  let aiResponse;
  try {
    aiResponse = await callClaudeAPI(env, prompt, []);
  } catch {
    try {
      aiResponse = await callGeminiAPI(env, prompt, []);
    } catch (e) {
      return json({ error: 'AI failed: ' + e.message }, 502);
    }
  }

  // Deduct credit
  updated.credits -= 1;
  updated.creditsUsedThisMonth = (updated.creditsUsedThisMonth || 0) + 1;
  await env.BQ_USERS.put(`user:${updated.email}`, JSON.stringify(updated));
  await logCreditUsage(updated.email, 'memory-generate', 'Generate Memories', env);

  // Parse and save new memories
  let newMems;
  try {
    newMems = JSON.parse(aiResponse.replace(/```json|```/g, '').trim());
  } catch {
    return json({ error: 'AI returned invalid format', raw: aiResponse }, 500);
  }

  const key = `memories:${user.email}`;
  for (const m of newMems) {
    existing.push({
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      content: m.content,
      category: m.category || 'General',
      importance: m.importance || 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generated: true
    });
  }
  if (existing.length > 200) existing.splice(0, existing.length - 200);
  await env.BQ_USERS.put(key, JSON.stringify(existing));

  return json({ ok: true, generated: newMems.length, credits: updated.credits });
}

// ── Gift Codes ──

async function handleRedeemCode(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const { code } = await request.json();
  if (!code) return json({ error: 'Code required' }, 400);

  const codeKey = `giftcode:${code.toUpperCase().trim()}`;
  const raw = await env.BQ_USERS.get(codeKey);
  if (!raw) return json({ error: 'Invalid code' }, 404);

  const gc = JSON.parse(raw);
  if (gc.used) return json({ error: 'Code already used' }, 400);

  // Mark as used
  gc.used = true;
  gc.usedBy = user.email;
  gc.usedAt = new Date().toISOString();
  await env.BQ_USERS.put(codeKey, JSON.stringify(gc));

  // Add credits
  user.credits = (user.credits || 0) + (gc.credits || 0);
  await env.BQ_USERS.put(`user:${user.email}`, JSON.stringify(user));

  return json({ ok: true, credits: gc.credits, total: user.credits });
}

async function handleAdminCreateGiftCode(request, env) {
  if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 403);

  const { credits, note } = await request.json();
  if (!credits || credits < 1) return json({ error: 'credits required (min 1)' }, 400);

  // Generate random 8-char code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];

  const gc = {
    code,
    credits: parseInt(credits),
    type: 'gift',
    note: note || '',
    createdAt: new Date().toISOString(),
    used: false
  };

  await env.BQ_USERS.put(`giftcode:${code}`, JSON.stringify(gc));
  return json({ ok: true, code, credits: gc.credits });
}

// ── Affiliate ──

async function handleAffiliateRegister(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const { paypalEmail } = await request.json();
  if (!paypalEmail || !paypalEmail.includes('@')) return json({ error: 'Valid PayPal email required' }, 400);

  const key = `affiliate:${user.email}`;
  const existing = await env.BQ_USERS.get(key);
  if (existing) {
    const aff = JSON.parse(existing);
    aff.paypalEmail = paypalEmail;
    await env.BQ_USERS.put(key, JSON.stringify(aff));
    return json({ ok: true, updated: true });
  }

  const aff = {
    email: user.email,
    paypalEmail,
    referrals: [],
    earnings: 0,
    joinedAt: new Date().toISOString()
  };
  await env.BQ_USERS.put(key, JSON.stringify(aff));
  return json({ ok: true, created: true });
}

async function handleAffiliateStats(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const key = `affiliate:${user.email}`;
  const raw = await env.BQ_USERS.get(key);
  if (!raw) return json({ ok: true, registered: false });

  const aff = JSON.parse(raw);
  return json({
    ok: true,
    registered: true,
    paypalEmail: aff.paypalEmail,
    referrals: aff.referrals?.length || 0,
    earnings: aff.earnings || 0,
    joinedAt: aff.joinedAt
  });
}

// ── Daily News ──

const NEWS_CATEGORIES = [
  {
    id: 'industry',
    label: 'Industry News',
    icon: '🗞️',
    prompt: 'Generate 8 construction and remodeling industry news items relevant to Los Angeles contractors in 2026. Focus on: major projects, market trends, material prices, labor market, housing starts, permit data. Return as JSON array: [{"title":"...","summary":"2-3 sentences","source":"publication name like ENR, Construction Dive, LA Business Journal","url":"https://plausible-source-url","image":null,"amazonUrl":null}]. JSON only, no markdown.',
  },
  {
    id: 'videos',
    label: 'Top Videos This Week',
    icon: '🎬',
    prompt: 'Recommend 8 valuable YouTube videos construction contractors should watch. Mix of: business advice, tool reviews, technique tutorials, industry insights, motivational content from established channels. Return as JSON array with real channel names: [{"title":"video title","summary":"what you learn, 1-2 sentences","source":"YouTube channel name","url":"https://www.youtube.com/results?search_query=URL-encoded-search-query","image":null,"videoEmbed":"https://www.youtube.com/embed/VIDEO_ID_PLACEHOLDER","amazonUrl":null}]. Use realistic channel names like The Build Show, Essential Craftsman, Hammer & Hand, Matt Risinger, Pro Tool Reviews. Keep videoEmbed as the search URL format since we cannot confirm real video IDs. JSON only.',
  },
  {
    id: 'shops',
    label: 'New Shops & Suppliers',
    icon: '🏪',
    prompt: 'List 6 notable construction supply stores, lumber yards, tile shops, or building material suppliers in the Los Angeles area contractors should know about. Include location notes. Return as JSON array: [{"title":"store name","summary":"what they offer, location, why notable","source":"Google Maps","url":"https://www.google.com/maps/search/URL-ENCODED-STORE-NAME","image":null,"rating":"4.5/5","amazonUrl":null}]. JSON only.',
  },
  {
    id: 'products',
    label: 'New Products & Tools',
    icon: '🔧',
    prompt: 'Recommend 8 notable construction products, power tools, or building materials trending in 2026. Focus on things contractors and remodelers would actually buy and use daily. Return as JSON array: [{"title":"product name","summary":"what it does, why it matters, typical price","source":"manufacturer","url":null,"image":null,"amazonUrl":"https://www.amazon.com/s?k=URL-ENCODED-PRODUCT-NAME"}]. Include an Amazon search URL for each so we can monetize with affiliate links later. JSON only.',
  },
  {
    id: 'tech',
    label: 'New Technology',
    icon: '🤖',
    prompt: 'Recommend 6 recent construction technology developments. AI tools, drones, 3D printing, project management software, smart building tech, AR/VR for contractors. Return as JSON array: [{"title":"...","summary":"2-3 sentences","source":"publication or company name","url":null,"image":null,"amazonUrl":null}]. JSON only.',
  },
  {
    id: 'law',
    label: 'California Law Updates',
    icon: '📋',
    prompt: 'List 6 important California construction law updates, building code changes, permit requirements, or OSHA regulation changes for 2026 affecting contractors. Title 24, CalGreen, CSLB, LADBS, labor laws, wildfire codes. Return as JSON array: [{"title":"law/code name","summary":"what changed, who it affects, deadline","source":"CSLB, LADBS, or CA.gov","url":null,"image":null,"amazonUrl":null}]. JSON only.',
  },
  {
    id: 'jobs',
    label: 'Job Seekers / Runners',
    icon: '👷',
    prompt: 'Generate 6 realistic job seeker profiles for construction workers, helpers, runners, and skilled tradesmen looking for work in Los Angeles. Fictional but realistic. Return as JSON array: [{"title":"Name — Role","summary":"experience, skills, availability, what they want","source":"BQ Tools Network","url":null,"image":null,"amazonUrl":null}]. JSON only.',
  },
  {
    id: 'tips',
    label: 'Business Tips',
    icon: '💡',
    prompt: 'Provide 6 actionable business tips for small construction/remodeling companies. Topics: getting clients, managing projects, pricing, marketing, scaling, avoiding common mistakes. Each tip specific and practical. Return as JSON array: [{"title":"tip title","summary":"detailed actionable advice in 2-3 sentences","source":"BQ Tools","url":null,"image":null,"amazonUrl":null}]. JSON only.',
  },
  {
    id: 'deals',
    label: 'Amazon Deals',
    icon: '🛒',
    prompt: 'Recommend 8 construction tools and supplies that contractors buy frequently on Amazon. Mix of: power tools, hand tools, safety gear, measuring instruments, fasteners. Return as JSON array: [{"title":"product name","summary":"what it is, why contractors need it, typical Amazon price range","source":"Amazon","url":null,"image":null,"amazonUrl":"https://www.amazon.com/s?k=URL-ENCODED-SEARCH-TERM"}]. These will have my affiliate tag added later. JSON only.',
  },
];

async function refreshNews(env, force = false) {
  const today = new Date().toISOString().split('T')[0];

  // Check if already generated today (skip if force=true)
  if (!force) {
    const existing = await env.BQ_USERS.get(`news:${today}`);
    if (existing) return; // Already done
  }

  const results = {};

  for (const cat of NEWS_CATEGORIES) {
    try {
      const aiResponse = await callClaudeAPI(env, cat.prompt, []);
      let items;
      try {
        items = JSON.parse(aiResponse.replace(/```json|```/g, '').trim());
      } catch {
        items = [{ title: 'Update coming soon', summary: 'Check back later for ' + cat.label, source: 'BQ Tools', url: null, image: null }];
      }
      results[cat.id] = {
        label: cat.label,
        icon: cat.icon,
        items: Array.isArray(items) ? items.slice(0, 5) : [items],
      };
    } catch (err) {
      results[cat.id] = {
        label: cat.label,
        icon: cat.icon,
        items: [{ title: 'Temporarily unavailable', summary: 'News will be updated shortly.', source: 'BQ Tools', url: null, image: null }],
      };
    }
  }

  const newsData = {
    date: today,
    generatedAt: new Date().toISOString(),
    categories: results,
  };

  // Save today's news + archive
  await env.BQ_USERS.put('news:today', JSON.stringify(newsData));
  await env.BQ_USERS.put(`news:${today}`, JSON.stringify(newsData), { expirationTtl: 2592000 }); // 30 days
}

async function handleNewsToday(request, env) {
  const raw = await env.BQ_USERS.get('news:today');
  if (!raw) {
    return json({ ok: true, news: null, message: 'No news yet. Check back tomorrow!' });
  }
  return json({ ok: true, news: JSON.parse(raw) });
}

async function handleNewsArchive(request, env) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ error: 'date param required (YYYY-MM-DD)' }, 400);
  }
  const raw = await env.BQ_USERS.get(`news:${date}`);
  if (!raw) return json({ ok: true, news: null, message: 'No news for this date' });
  return json({ ok: true, news: JSON.parse(raw) });
}

async function handleAdminNewsRefresh(request, env) {
  if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 403);
  await refreshNews(env, true); // force refresh
  return json({ ok: true, message: 'News refreshed' });
}

// ── Training System ──

async function handleTrainingList(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const raw = await env.BQ_USERS.get(`training:${user.email}`);
  const files = raw ? JSON.parse(raw) : [];
  // Don't send full content_text to list endpoint, just metadata
  return json({
    ok: true,
    files: files.map(f => ({
      id: f.id, filename: f.filename, type: f.type,
      uploadedAt: f.uploadedAt, contentLength: (f.content_text || '').length
    })),
    count: files.length
  });
}

async function handleTrainingUpload(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  if (!(await checkRateLimit(user.email, env))) {
    return json({ error: 'Rate limit exceeded' }, 429);
  }

  const updated = checkMonthlyReset(user);
  if (updated.credits < 1) {
    return json({ error: 'Need 1 credit for training upload', credits: updated.credits }, 402);
  }

  const body = await request.json();
  const { filename, type, imageBase64, textContent } = body;
  if (!filename) return json({ error: 'filename required' }, 400);

  // Extract text from image if image provided, else use textContent
  let content_text = textContent || '';
  if (imageBase64) {
    const extractPrompt = 'Extract ALL text from this document (contract, invoice, price list, or quote). Preserve structure: line items, prices, dates, quantities. Return as plain text. If not readable, return "UNREADABLE".';
    try {
      content_text = await callClaudeAPI(env, extractPrompt, [imageBase64]);
    } catch (e) {
      return json({ error: 'Failed to extract text: ' + e.message }, 502);
    }
  }

  if (!content_text || content_text.trim().length < 10) {
    return json({ error: 'Could not extract usable content' }, 400);
  }

  // Limit content to 20KB per file
  if (content_text.length > 20000) content_text = content_text.substring(0, 20000);

  const key = `training:${user.email}`;
  const raw = await env.BQ_USERS.get(key);
  const files = raw ? JSON.parse(raw) : [];

  // Max 20 files per user — auto-delete oldest
  if (files.length >= 20) files.splice(0, files.length - 19);

  const newFile = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    filename: filename.substring(0, 100),
    type: type || 'document',
    content_text,
    uploadedAt: new Date().toISOString()
  };
  files.push(newFile);
  await env.BQ_USERS.put(key, JSON.stringify(files));

  // Invalidate knowledge cache so it rebuilds next time
  await env.BQ_USERS.delete(`knowledge:${user.email}`);

  // Deduct credit
  updated.credits -= 1;
  updated.creditsUsedThisMonth = (updated.creditsUsedThisMonth || 0) + 1;
  await env.BQ_USERS.put(`user:${updated.email}`, JSON.stringify(updated));
  await logCreditUsage(updated.email, 'training-upload', filename, env);

  return json({ ok: true, file: { id: newFile.id, filename: newFile.filename }, count: files.length, credits: updated.credits });
}

async function handleTrainingDelete(request, env, path) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const id = path.split('/').pop();
  const key = `training:${user.email}`;
  const raw = await env.BQ_USERS.get(key);
  const files = raw ? JSON.parse(raw) : [];

  const filtered = files.filter(f => f.id !== id);
  if (filtered.length === files.length) return json({ error: 'File not found' }, 404);

  await env.BQ_USERS.put(key, JSON.stringify(filtered));
  await env.BQ_USERS.delete(`knowledge:${user.email}`); // invalidate

  return json({ ok: true, count: filtered.length });
}

async function handleTrainingKnowledge(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const knowledge = await buildKnowledgeBase(user.email, env);
  return json({ ok: true, knowledge });
}

async function buildKnowledgeBase(email, env) {
  // Try cache first
  const cached = await env.BQ_USERS.get(`knowledge:${email}`);
  if (cached) return JSON.parse(cached);

  const raw = await env.BQ_USERS.get(`training:${email}`);
  const files = raw ? JSON.parse(raw) : [];

  if (files.length === 0) {
    return { trained: false, fileCount: 0, summary: '', materials: [], labor: [], markup: null, projectTypes: [] };
  }

  // Combine all training text (truncate total to 30KB)
  let combined = files.map(f => `=== ${f.filename} (${f.type}) ===\n${f.content_text}`).join('\n\n');
  if (combined.length > 30000) combined = combined.substring(0, 30000);

  const prompt = `Analyze these contractor documents (contracts, invoices, quotes, price lists) and extract a structured pricing profile. Return JSON:
{
  "summary": "2-3 sentence summary of this contractor's pricing patterns",
  "materials": [{"name":"material name","avgPrice":"$X-Y per unit","unit":"sqft/unit/etc"}],
  "labor": [{"task":"task name","rate":"$X-Y per hour or per sqft","notes":"..."}],
  "markupRange": "typical markup % range",
  "projectTypes": ["type1","type2"],
  "contractTerms": ["common clause 1","common clause 2"],
  "paymentStructure": "typical payment schedule"
}

DOCUMENTS:
${combined}

Return JSON only, no markdown.`;

  let aiResponse;
  try {
    aiResponse = await callClaudeAPI(env, prompt, []);
  } catch {
    return { trained: true, fileCount: files.length, summary: 'Analysis pending', materials: [], labor: [] };
  }

  let parsed;
  try {
    parsed = JSON.parse(aiResponse.replace(/```json|```/g, '').trim());
  } catch {
    parsed = { summary: aiResponse.substring(0, 500) };
  }

  const knowledge = {
    trained: true,
    fileCount: files.length,
    updatedAt: new Date().toISOString(),
    ...parsed
  };

  await env.BQ_USERS.put(`knowledge:${email}`, JSON.stringify(knowledge), { expirationTtl: 604800 }); // cache 7 days
  return knowledge;
}

// ── Quote System ──

async function handleQuoteList(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const raw = await env.BQ_USERS.get(`quotes:${user.email}`);
  const quotes = raw ? JSON.parse(raw) : [];
  return json({ ok: true, quotes, count: quotes.length });
}

async function handleQuoteGet(request, env, path) {
  // Skip known sub-routes
  if (path === '/api/quotes/generate') return json({ error: 'Use POST' }, 405);
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const id = path.split('/').pop();
  const raw = await env.BQ_USERS.get(`quotes:${user.email}`);
  const quotes = raw ? JSON.parse(raw) : [];
  const quote = quotes.find(q => q.id === id);
  if (!quote) return json({ error: 'Quote not found' }, 404);
  return json({ ok: true, quote });
}

async function handleQuoteSave(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const quote = await request.json();
  const key = `quotes:${user.email}`;
  const raw = await env.BQ_USERS.get(key);
  const quotes = raw ? JSON.parse(raw) : [];

  // Generate quote number if not set
  const year = new Date().getFullYear();
  const num = String(quotes.length + 1).padStart(4, '0');

  const newQuote = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    quoteNumber: quote.quoteNumber || `BQ-${year}-${num}`,
    clientName: quote.clientName || '',
    clientAddress: quote.clientAddress || '',
    projectTitle: quote.projectTitle || 'Untitled Project',
    projectDescription: quote.projectDescription || '',
    lineItems: quote.lineItems || [],
    subtotal: quote.subtotal || 0,
    tax: quote.tax || 0,
    total: quote.total || 0,
    terms: quote.terms || '',
    template: quote.template || 'detailed',
    status: quote.status || 'Draft',
    date: quote.date || new Date().toISOString(),
    validUntil: quote.validUntil || new Date(Date.now() + 30 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  quotes.unshift(newQuote);
  if (quotes.length > 500) quotes.length = 500;
  await env.BQ_USERS.put(key, JSON.stringify(quotes));

  return json({ ok: true, quote: newQuote });
}

async function handleQuoteUpdate(request, env, path) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const id = path.split('/').pop();
  const updates = await request.json();
  const key = `quotes:${user.email}`;
  const raw = await env.BQ_USERS.get(key);
  const quotes = raw ? JSON.parse(raw) : [];

  const idx = quotes.findIndex(q => q.id === id);
  if (idx === -1) return json({ error: 'Quote not found' }, 404);

  const allowed = ['clientName', 'clientAddress', 'projectTitle', 'projectDescription',
    'lineItems', 'subtotal', 'tax', 'total', 'terms', 'status'];
  for (const k of allowed) {
    if (updates[k] !== undefined) quotes[idx][k] = updates[k];
  }
  quotes[idx].updatedAt = new Date().toISOString();

  await env.BQ_USERS.put(key, JSON.stringify(quotes));
  return json({ ok: true, quote: quotes[idx] });
}

async function handleQuoteDelete(request, env, path) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const id = path.split('/').pop();
  const key = `quotes:${user.email}`;
  const raw = await env.BQ_USERS.get(key);
  const quotes = raw ? JSON.parse(raw) : [];

  const filtered = quotes.filter(q => q.id !== id);
  if (filtered.length === quotes.length) return json({ error: 'Quote not found' }, 404);

  await env.BQ_USERS.put(key, JSON.stringify(filtered));
  return json({ ok: true, count: filtered.length });
}

async function handleQuoteGenerate(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  if (!(await checkRateLimit(user.email, env))) {
    return json({ error: 'Rate limit exceeded' }, 429);
  }

  const updated = checkMonthlyReset(user);
  if (updated.credits < 1) {
    return json({ error: 'Need 1 credit', credits: updated.credits }, 402);
  }

  const body = await request.json();
  const { projectDescription, template, images, clientName, location } = body;
  if (!projectDescription) return json({ error: 'projectDescription required' }, 400);

  // Load user's knowledge base
  const knowledge = await buildKnowledgeBase(updated.email, env);

  // Build personalized system context
  let personalContext = '';
  if (knowledge.trained) {
    personalContext = `\n\n=== THIS CONTRACTOR'S PRICING PROFILE (use this for accuracy) ===
${knowledge.summary || ''}
Materials: ${JSON.stringify(knowledge.materials || [])}
Labor rates: ${JSON.stringify(knowledge.labor || [])}
Markup range: ${knowledge.markupRange || 'standard'}
Typical project types: ${(knowledge.projectTypes || []).join(', ')}
Common terms: ${(knowledge.contractTerms || []).join('; ')}
Payment structure: ${knowledge.paymentStructure || 'standard'}
=== END OF PROFILE ===\n\nUse these rates and patterns. If a project detail is not covered by the profile, use market-typical LA pricing.\n`;
  }

  const templateInstructions = {
    quick: 'Simple quote with just a total price and brief description.',
    detailed: 'Detailed quote with itemized line items (description, quantity, unit price, total for each).',
    premium: 'Premium quote with itemized line items, material specifications, timeline, and full terms.'
  };

  const prompt = `You are a professional quote generator for a construction contractor.
${personalContext}

Generate a quote for the following project${location ? ' in ' + location : ''}:
"${projectDescription}"
${clientName ? 'Client: ' + clientName : ''}

Format: ${templateInstructions[template] || templateInstructions.detailed}

Return as JSON ONLY:
{
  "projectTitle": "short project title",
  "summary": "1-2 sentence project scope",
  "lineItems": [
    {"description":"item description","quantity":1,"unit":"unit","unitPrice":0,"total":0}
  ],
  "subtotal": 0,
  "taxRate": 9.5,
  "tax": 0,
  "total": 0,
  "timeline": "estimated duration",
  "terms": "payment terms and conditions in 3-5 bullet points",
  "notes": "any additional notes"
}

All prices in USD. Tax is ${location && location.toLowerCase().includes('los angeles') ? '9.5' : '9.5'}% for CA. Be realistic.`;

  let aiResponse;
  try {
    aiResponse = await callClaudeAPI(env, prompt, images || []);
  } catch (e) {
    try {
      aiResponse = await callGeminiAPI(env, prompt, images || []);
    } catch (e2) {
      return json({ error: 'AI failed: ' + e.message }, 502);
    }
  }

  let quote;
  try {
    quote = JSON.parse(aiResponse.replace(/```json|```/g, '').trim());
  } catch {
    return json({ error: 'AI returned invalid format', raw: aiResponse }, 500);
  }

  // Deduct credit
  updated.credits -= 1;
  updated.creditsUsedThisMonth = (updated.creditsUsedThisMonth || 0) + 1;
  await env.BQ_USERS.put(`user:${updated.email}`, JSON.stringify(updated));
  await logCreditUsage(updated.email, 'quote-generate', quote.projectTitle || 'Quote', env);

  return json({
    ok: true,
    quote,
    personalized: knowledge.trained,
    fileCount: knowledge.fileCount,
    credits: updated.credits
  });
}

// ── Contract Generator ──

async function handleContractGenerate(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  if (!(await checkRateLimit(user.email, env))) {
    return json({ error: 'Rate limit exceeded' }, 429);
  }

  const updated = checkMonthlyReset(user);
  if (updated.credits < 2) {
    return json({ error: 'Need 2 credits', credits: updated.credits }, 402);
  }

  const body = await request.json();
  const { clientName, clientAddress, projectDescription, startDate, endDate, amount, paymentTerms } = body;
  if (!projectDescription || !amount) return json({ error: 'projectDescription and amount required' }, 400);

  const knowledge = await buildKnowledgeBase(updated.email, env);
  let personalContext = '';
  if (knowledge.trained && knowledge.contractTerms?.length) {
    personalContext = `\nThis contractor's typical contract clauses: ${knowledge.contractTerms.join('; ')}\nPayment structure: ${knowledge.paymentStructure || 'standard'}\n`;
  }

  const businessName = updated.businessName || 'Contractor';
  const prompt = `Generate a professional construction contract. ${personalContext}

Details:
- Contractor: ${businessName}
- Client: ${clientName || '[Client Name]'}
- Client Address: ${clientAddress || '[Client Address]'}
- Project: ${projectDescription}
- Start Date: ${startDate || 'TBD'}
- End Date: ${endDate || 'TBD'}
- Total Amount: $${amount}
- Payment Terms: ${paymentTerms || 'standard'}

Return as JSON:
{
  "title": "CONSTRUCTION AGREEMENT",
  "scope": "detailed scope of work in paragraphs",
  "payment": "payment schedule with milestones",
  "timeline": "work schedule description",
  "materials": "who provides materials",
  "changeOrders": "change order policy",
  "warranty": "warranty terms",
  "termination": "termination clause",
  "disputes": "dispute resolution (California law)",
  "signatures": "signature block description"
}

California-compliant. Professional legal language. JSON only.`;

  let aiResponse;
  try {
    aiResponse = await callClaudeAPI(env, prompt, []);
  } catch (e) {
    return json({ error: 'AI failed: ' + e.message }, 502);
  }

  let contract;
  try {
    contract = JSON.parse(aiResponse.replace(/```json|```/g, '').trim());
  } catch {
    return json({ error: 'AI returned invalid format', raw: aiResponse }, 500);
  }

  updated.credits -= 2;
  updated.creditsUsedThisMonth = (updated.creditsUsedThisMonth || 0) + 2;
  await env.BQ_USERS.put(`user:${updated.email}`, JSON.stringify(updated));
  await logCreditUsage(updated.email, 'contract-generate', projectDescription.substring(0, 50), env);

  return json({ ok: true, contract, credits: updated.credits });
}

// ── Business Operations Suite — Generic CRUD ──

const BUSINESS_COLLECTIONS = {
  receipts: { allowed: ['vendor', 'date', 'total', 'tax', 'items', 'category', 'projectId', 'notes', 'thumbnail', 'rawText', 'status'] },
  clients: { allowed: ['name', 'phone', 'email', 'address', 'city', 'source', 'notes', 'tags', 'lastContactDate', 'totalSpent', 'photo'] },
  expenses: { allowed: ['amount', 'date', 'vendor', 'category', 'description', 'projectId', 'recurring', 'taxDeductible', 'receiptId'] },
  bprojects: { allowed: ['name', 'clientId', 'clientName', 'address', 'status', 'startDate', 'endDate', 'value', 'percentComplete', 'description', 'dailyLogs', 'punchList', 'changeOrders', 'documents', 'thumbnail'] },
  suppliers: { allowed: ['name', 'type', 'phone', 'email', 'address', 'website', 'hours', 'rating', 'notes', 'lat', 'lng', 'lastVisit', 'photo'] },
  equipment: { allowed: ['name', 'brand', 'model', 'serial', 'purchaseDate', 'cost', 'location', 'photo', 'status', 'category', 'assignedTo', 'projectId', 'lastService', 'nextService', 'mileage', 'fuelLogs'] },
  timelogs: { allowed: ['date', 'clockIn', 'clockOut', 'hours', 'projectId', 'projectName', 'task', 'workerName', 'workerEmail', 'hourlyRate', 'gps', 'notes', 'status'] },
  compliance: { allowed: ['name', 'type', 'expirationDate', 'issueDate', 'file', 'projectId', 'status', 'cost', 'issuingAuthority', 'notes', 'documentUrl', 'incidentType', 'incidentDate', 'description', 'action'] },
  invoices: { allowed: ['invoiceNumber', 'clientId', 'clientName', 'clientAddress', 'projectId', 'projectTitle', 'issueDate', 'dueDate', 'paymentTerms', 'lineItems', 'subtotal', 'tax', 'total', 'amountPaid', 'status', 'notes', 'sentDate', 'viewedDate', 'paidDate'] },
  taxes: { allowed: ['year', 'quarter', 'type', 'amount', 'dueDate', 'paidDate', 'status', 'category', 'notes', 'miles', 'startLocation', 'endLocation', 'purpose'] },
  doorknockers: { allowed: ['name', 'phone', 'email', 'city', 'areas', 'languages', 'rating', 'ratePerDoor', 'experience', 'photo', 'bio', 'verified', 'available', 'lat', 'lng'] },
  doorbookings: { allowed: ['knockerId', 'knockerName', 'contractorEmail', 'date', 'area', 'doors', 'ratePerDoor', 'total', 'status', 'notes'] },
  jobs: { allowed: ['title', 'type', 'skills', 'location', 'rate', 'rateType', 'description', 'postedBy', 'contactPhone', 'contactEmail', 'status', 'applicants', 'featured'] },
  workers: { allowed: ['name', 'phone', 'email', 'skills', 'location', 'rate', 'rateType', 'languages', 'licenseNumber', 'bio', 'photo', 'available', 'rating', 'featured', 'yearsExperience'] },
};

async function handleBusinessCRUD(request, env, collection, itemId) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const conf = BUSINESS_COLLECTIONS[collection];
  if (!conf) return json({ error: 'Unknown collection' }, 400);

  const key = `${collection}:${user.email}`;
  const method = request.method;

  if (method === 'GET') {
    const raw = await env.BQ_USERS.get(key);
    const items = raw ? JSON.parse(raw) : [];
    if (itemId) {
      const item = items.find(i => i.id === itemId);
      if (!item) return json({ error: 'Not found' }, 404);
      return json({ ok: true, item });
    }
    return json({ ok: true, items, count: items.length });
  }

  if (method === 'POST') {
    if (itemId) return json({ error: 'Use PUT for updates' }, 405);
    const body = await request.json();
    const raw = await env.BQ_USERS.get(key);
    const items = raw ? JSON.parse(raw) : [];

    const newItem = { id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    for (const k of conf.allowed) {
      if (body[k] !== undefined) newItem[k] = body[k];
    }

    items.unshift(newItem);
    if (items.length > 1000) items.length = 1000;
    await env.BQ_USERS.put(key, JSON.stringify(items));
    return json({ ok: true, item: newItem });
  }

  if (method === 'PUT') {
    if (!itemId) return json({ error: 'Item ID required' }, 400);
    const body = await request.json();
    const raw = await env.BQ_USERS.get(key);
    const items = raw ? JSON.parse(raw) : [];
    const idx = items.findIndex(i => i.id === itemId);
    if (idx === -1) return json({ error: 'Not found' }, 404);

    for (const k of conf.allowed) {
      if (body[k] !== undefined) items[idx][k] = body[k];
    }
    items[idx].updatedAt = new Date().toISOString();
    await env.BQ_USERS.put(key, JSON.stringify(items));
    return json({ ok: true, item: items[idx] });
  }

  if (method === 'DELETE') {
    if (!itemId) return json({ error: 'Item ID required' }, 400);
    const raw = await env.BQ_USERS.get(key);
    const items = raw ? JSON.parse(raw) : [];
    const filtered = items.filter(i => i.id !== itemId);
    if (filtered.length === items.length) return json({ error: 'Not found' }, 404);
    await env.BQ_USERS.put(key, JSON.stringify(filtered));
    return json({ ok: true, count: filtered.length });
  }

  return json({ error: 'Method not allowed' }, 405);
}

// ── Apify Helper ──
async function runApifyActor(env, actorSlug, input, pollSeconds = 60) {
  const apifyToken = env.APIFY_TOKEN;
  if (!apifyToken) throw new Error('Apify not configured');

  const runRes = await fetch(`https://api.apify.com/v2/acts/${actorSlug}/runs?token=${apifyToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  const runData = await runRes.json();
  const runId = runData.data?.id;
  if (!runId) throw new Error('Apify start failed: ' + (runData.error?.message || 'unknown'));

  // Poll
  const maxAttempts = Math.ceil(pollSeconds / 2);
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const s = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`);
    const sd = await s.json();
    const status = sd.data?.status;
    if (status === 'SUCCEEDED') break;
    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error('Apify run failed: ' + status);
    }
  }

  const dataRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apifyToken}`);
  return await dataRes.json();
}

// ── Content Scan (Instagram) ──
async function handleContentScan(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  if (!(await checkRateLimit(user.email, env))) {
    return json({ error: 'Rate limit exceeded' }, 429);
  }

  const updated = checkMonthlyReset(user);
  if (updated.credits < 2) {
    return json({ error: 'Need 2 credits', credits: updated.credits }, 402);
  }

  const { username } = await request.json();
  if (!username) return json({ error: 'username required' }, 400);

  const cleanUser = username.replace(/^@/, '').replace(/^https?:\/\/(www\.)?(instagram|facebook)\.com\//, '').replace(/\/$/, '').split('?')[0].split('/')[0];

  // Use apify/instagram-scraper for posts
  let posts;
  try {
    const items = await runApifyActor(env, 'apify~instagram-post-scraper', {
      username: [cleanUser],
      resultsLimit: 30
    }, 90);
    posts = items;
  } catch (e) {
    // Fallback: try the profile-scraper which includes latestPosts
    try {
      const items = await runApifyActor(env, 'apify~instagram-profile-scraper', {
        usernames: [cleanUser],
        resultsLimit: 30
      }, 60);
      if (items.length > 0 && items[0].latestPosts) {
        posts = items[0].latestPosts;
      } else {
        throw new Error('No posts found');
      }
    } catch (e2) {
      return json({ error: 'Instagram scrape failed: ' + e.message }, 502);
    }
  }

  if (!posts || posts.length === 0) {
    return json({ error: 'No posts found for @' + cleanUser }, 404);
  }

  // Normalize posts
  const normalized = posts.map(p => ({
    id: p.id || p.shortCode || Date.now() + Math.random(),
    shortCode: p.shortCode,
    url: p.url || (p.shortCode ? `https://www.instagram.com/p/${p.shortCode}/` : ''),
    caption: p.caption || '',
    likes: p.likesCount || 0,
    comments: p.commentsCount || 0,
    videoViews: p.videoViewCount || p.videoPlayCount || 0,
    type: p.type || (p.videoUrl ? 'Video' : 'Image'),
    thumbnail: p.displayUrl || p.thumbnailUrl || '',
    videoUrl: p.videoUrl || '',
    timestamp: p.timestamp || p.taken_at || null,
    hashtags: p.hashtags || (p.caption || '').match(/#\w+/g) || [],
    engagement: (p.likesCount || 0) + (p.commentsCount || 0)
  }));

  // Sort by engagement desc
  normalized.sort((a, b) => b.engagement - a.engagement);

  // Compute analytics
  const total = normalized.length;
  const avgLikes = Math.round(normalized.reduce((s, p) => s + p.likes, 0) / total);
  const avgComments = Math.round(normalized.reduce((s, p) => s + p.comments, 0) / total);
  const topPost = normalized[0];

  // Best day
  const dayMap = {};
  normalized.forEach(p => {
    if (!p.timestamp) return;
    const d = new Date(p.timestamp).toLocaleDateString('en-US', { weekday: 'long' });
    dayMap[d] = (dayMap[d] || 0) + p.engagement;
  });
  const bestDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

  // Best type
  const typeMap = {};
  normalized.forEach(p => {
    const t = p.type || 'Image';
    if (!typeMap[t]) typeMap[t] = { sum: 0, count: 0 };
    typeMap[t].sum += p.engagement;
    typeMap[t].count += 1;
  });
  const typePerf = Object.entries(typeMap).map(([t, v]) => ({ type: t, avg: Math.round(v.sum / v.count), count: v.count }));
  typePerf.sort((a, b) => b.avg - a.avg);

  // Top hashtags
  const tagCount = {};
  normalized.forEach(p => {
    (p.hashtags || []).forEach(h => {
      const tag = (typeof h === 'string' ? h : h.name || '').toLowerCase();
      if (tag) tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
  });
  const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t, c]) => ({ tag: t, count: c }));

  const analytics = {
    username: cleanUser,
    totalPosts: total,
    avgLikes,
    avgComments,
    topPost: topPost ? { url: topPost.url, likes: topPost.likes, caption: (topPost.caption || '').substring(0, 120) } : null,
    bestDay,
    typePerformance: typePerf,
    topHashtags: topTags
  };

  // Deduct 2 credits
  updated.credits -= 2;
  updated.creditsUsedThisMonth = (updated.creditsUsedThisMonth || 0) + 2;
  await env.BQ_USERS.put(`user:${updated.email}`, JSON.stringify(updated));
  await logCreditUsage(updated.email, 'content-scan', '@' + cleanUser, env);

  return json({ ok: true, analytics, posts: normalized.slice(0, 30), credits: updated.credits });
}

// ── Moodboard ──
async function handleMoodboardList(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const raw = await env.BQ_USERS.get(`moodboard:${user.email}`);
  const items = raw ? JSON.parse(raw) : [];
  return json({ ok: true, items, count: items.length });
}

async function handleMoodboardSave(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const post = await request.json();
  const key = `moodboard:${user.email}`;
  const raw = await env.BQ_USERS.get(key);
  const items = raw ? JSON.parse(raw) : [];

  const newItem = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    savedAt: new Date().toISOString(),
    sourceUsername: post.sourceUsername || '',
    url: post.url || '',
    thumbnail: (post.thumbnail || '').substring(0, 3000),
    caption: (post.caption || '').substring(0, 500),
    likes: post.likes || 0,
    comments: post.comments || 0,
    type: post.type || 'Image',
    hashtags: post.hashtags || [],
    notes: post.notes || ''
  };

  items.unshift(newItem);
  if (items.length > 100) items.length = 100;
  await env.BQ_USERS.put(key, JSON.stringify(items));
  return json({ ok: true, item: newItem });
}

async function handleMoodboardDelete(request, env, path) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const id = path.split('/').pop();
  const key = `moodboard:${user.email}`;
  const raw = await env.BQ_USERS.get(key);
  const items = raw ? JSON.parse(raw) : [];

  const filtered = items.filter(i => i.id !== id);
  if (filtered.length === items.length) return json({ error: 'Not found' }, 404);
  await env.BQ_USERS.put(key, JSON.stringify(filtered));
  return json({ ok: true, count: filtered.length });
}

// ── Video Downloader ──
async function handleVideoDownload(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  if (!(await checkRateLimit(user.email, env))) {
    return json({ error: 'Rate limit exceeded' }, 429);
  }

  const updated = checkMonthlyReset(user);
  if (updated.credits < 1) {
    return json({ error: 'Need 1 credit', credits: updated.credits }, 402);
  }

  const { url } = await request.json();
  if (!url) return json({ error: 'url required' }, 400);

  // Detect platform
  const platform = detectPlatform(url);
  if (!platform) return json({ error: 'Unsupported URL. Supported: TikTok, Instagram, YouTube' }, 400);

  let videoData;
  try {
    if (platform === 'tiktok') {
      videoData = await scrapeTikTok(env, url);
    } else if (platform === 'instagram') {
      videoData = await scrapeInstagram(env, url);
    } else if (platform === 'youtube') {
      videoData = await scrapeYouTube(env, url);
    }
  } catch (e) {
    return json({ error: 'Download failed: ' + e.message }, 502);
  }

  if (!videoData || !videoData.videoUrl) {
    return json({ error: 'Could not extract video. Make sure URL is public.' }, 404);
  }

  // Deduct credit
  updated.credits -= 1;
  updated.creditsUsedThisMonth = (updated.creditsUsedThisMonth || 0) + 1;
  await env.BQ_USERS.put(`user:${updated.email}`, JSON.stringify(updated));
  await logCreditUsage(updated.email, 'downloader', platform + ': ' + (videoData.title || 'video'), env);

  return json({ ok: true, platform, data: videoData, credits: updated.credits });
}

function detectPlatform(url) {
  const u = url.toLowerCase();
  if (u.includes('tiktok.com') || u.includes('vm.tiktok') || u.includes('vt.tiktok')) return 'tiktok';
  if (u.includes('instagram.com')) return 'instagram';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  return null;
}

async function scrapeTikTok(env, url) {
  const items = await runApifyActor(env, 'clockworks~tiktok-scraper', {
    postURLs: [url],
    resultsPerPage: 1,
    shouldDownloadVideos: false
  }, 45);
  if (!items || !items.length) throw new Error('No data returned');
  const p = items[0];
  return {
    videoUrl: p.videoMeta?.downloadAddr || p.videoUrl || '',
    thumbnail: p.videoMeta?.coverUrl || p['covers.default'] || '',
    title: p.text || '',
    author: p.authorMeta?.name || '',
    duration: p.videoMeta?.duration || null,
    platform: 'tiktok'
  };
}

async function scrapeInstagram(env, url) {
  // Use instagram-post-scraper
  const items = await runApifyActor(env, 'apify~instagram-post-scraper', {
    directUrls: [url],
    resultsLimit: 1
  }, 60);
  if (!items || !items.length) throw new Error('No data returned');
  const p = items[0];
  return {
    videoUrl: p.videoUrl || '',
    thumbnail: p.displayUrl || '',
    title: p.caption || '',
    author: p.ownerUsername || '',
    platform: 'instagram'
  };
}

async function scrapeYouTube(env, url) {
  // Try actors in order: first one with direct MP4 download URL
  // Actor 1: epctex/youtube-video-downloader (specifically designed for downloads)
  try {
    const items = await runApifyActor(env, 'epctex~youtube-video-downloader', {
      startUrls: [url],
      maxResults: 1
    }, 60);
    if (items && items.length > 0) {
      const v = items[0];
      // This actor returns a downloadable video URL
      const downloadUrl = v.downloadUrl || v.videoUrl || v.url;
      if (downloadUrl && downloadUrl.startsWith('http')) {
        return {
          videoUrl: downloadUrl,
          thumbnail: v.thumbnailUrl || v.thumbnail || '',
          title: v.title || '',
          author: v.channelName || v.author || '',
          duration: v.duration || null,
          platform: 'youtube'
        };
      }
    }
  } catch (e) {
    // Fall through to next actor
    console.log('epctex youtube failed:', e.message);
  }

  // Actor 2: scanny/youtube-video-downloader (backup)
  try {
    const items = await runApifyActor(env, 'scanny~youtube-video-downloader', {
      startUrls: [{ url }],
    }, 60);
    if (items && items.length > 0) {
      const v = items[0];
      const downloadUrl = v.downloadUrl || v.videoUrl || v.mp4;
      if (downloadUrl && downloadUrl.startsWith('http')) {
        return {
          videoUrl: downloadUrl,
          thumbnail: v.thumbnail || v.thumbnailUrl || '',
          title: v.title || '',
          author: v.channel || v.author || '',
          duration: v.duration || null,
          platform: 'youtube'
        };
      }
    }
  } catch (e) {
    console.log('scanny youtube failed:', e.message);
  }

  // Actor 3 (fallback): streamers/youtube-scraper — metadata only, no direct MP4
  try {
    const items = await runApifyActor(env, 'streamers~youtube-scraper', {
      startUrls: [{ url }],
      maxResults: 1
    }, 45);
    if (items && items.length > 0) {
      const v = items[0];
      // This returns metadata but no direct MP4 URL — return it anyway with a clear note
      return {
        videoUrl: '',
        thumbnail: v.thumbnailUrl || '',
        title: v.title || '',
        author: v.channelName || '',
        duration: v.duration || null,
        note: 'YouTube direct download is temporarily unavailable. Try TikTok or Instagram URLs, or use the BQ Tools Chrome Extension for YouTube.',
        platform: 'youtube'
      };
    }
  } catch (e) {
    // All failed
  }

  throw new Error('YouTube download unavailable. Try TikTok or Instagram URLs. Use the Chrome Extension for YouTube.');
}

// ── Receipt AI Extraction ──
async function handleReceiptExtract(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserByToken(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  if (!(await checkRateLimit(user.email, env))) {
    return json({ error: 'Rate limit exceeded' }, 429);
  }

  const updated = checkMonthlyReset(user);
  if (updated.credits < 1) {
    return json({ error: 'Need 1 credit', credits: updated.credits }, 402);
  }

  const { image } = await request.json();
  if (!image) return json({ error: 'image required' }, 400);

  const prompt = `Extract data from this receipt. Return JSON ONLY (no markdown):
{
  "vendor": "store name",
  "date": "YYYY-MM-DD",
  "total": 0,
  "tax": 0,
  "items": [{"name":"item","price":0,"quantity":1}],
  "category": "Materials|Tools|Fuel|Food|Office|Vehicle|Other",
  "rawText": "full receipt text for reference"
}
Guess category based on vendor and items. If unreadable, return {"error":"unreadable"}.`;

  let aiResponse;
  try {
    aiResponse = await callClaudeAPI(env, prompt, [image]);
  } catch (e) {
    try {
      aiResponse = await callGeminiAPI(env, prompt, [image]);
    } catch (e2) {
      return json({ error: 'AI failed: ' + e.message }, 502);
    }
  }

  let data;
  try {
    data = JSON.parse(aiResponse.replace(/```json|```/g, '').trim());
  } catch {
    return json({ error: 'AI returned invalid format', raw: aiResponse }, 500);
  }

  if (data.error) return json({ error: data.error, credits: updated.credits });

  // Deduct credit
  updated.credits -= 1;
  updated.creditsUsedThisMonth = (updated.creditsUsedThisMonth || 0) + 1;
  await env.BQ_USERS.put(`user:${updated.email}`, JSON.stringify(updated));
  await logCreditUsage(updated.email, 'receipt-extract', data.vendor || 'Receipt', env);

  return json({ ok: true, data, credits: updated.credits });
}
