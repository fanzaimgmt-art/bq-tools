// ── BQ Tools — Pro Code Auth ──

const VALID_CODES = [
  'BQPRO-2024-GOLD',
  'BQPRO-2024-VIP1',
  'BQPRO-2025-LAUNCH',
  'BQPRO-2026-BETA',
];

function isPro() {
  const data = localStorage.getItem('bq_pro');
  if (!data) return false;
  try {
    const obj = JSON.parse(data);
    return VALID_CODES.includes(obj.proCode?.toUpperCase());
  } catch {
    return false;
  }
}

function activatePro(code) {
  code = code.trim().toUpperCase();
  if (!code) return { ok: false, msg: 'enter_code' };
  if (VALID_CODES.includes(code)) {
    localStorage.setItem('bq_pro', JSON.stringify({
      proCode: code,
      activatedAt: new Date().toISOString().split('T')[0]
    }));
    return { ok: true };
  }
  return { ok: false, msg: 'invalid_code' };
}

function deactivatePro() {
  localStorage.removeItem('bq_pro');
}

// Gate: call before Pro features. Returns true if Pro, else shows upgrade popup.
function requirePro() {
  if (isPro()) return true;
  showUpgradeModal();
  return false;
}

function showUpgradeModal() {
  // Remove existing
  const old = document.getElementById('upgradeModal');
  if (old) old.remove();

  const m = document.createElement('div');
  m.id = 'upgradeModal';
  m.className = 'modal-overlay';
  m.innerHTML = `
    <div class="modal-card" style="text-align:center;max-width:400px;">
      <h3 data-en="Upgrade to Pro" data-he="שדרג ל-Pro">Upgrade to Pro</h3>
      <div style="font-size:40px;font-weight:900;color:var(--ac);margin:16px 0;">$14<span style="font-size:16px;color:var(--txd);font-weight:400">.99/mo</span></div>
      <p style="font-size:14px;color:var(--txd);margin-bottom:20px;line-height:1.6;" data-en="AI analysis, reports, estimates, social posts, and more." data-he="ניתוח AI, דוחות, הערכות עלויות, פוסטים ועוד.">AI analysis, reports, estimates, social posts, and more.</p>
      <div style="text-align:left;font-size:14px;color:var(--txd);margin-bottom:20px;line-height:2;">
        <b style="color:var(--tx)">1.</b> <span data-en="Pay via PayPal" data-he="שלם ב-PayPal">Pay via PayPal</span><br>
        <b style="color:var(--tx)">2.</b> <span data-en="Get your Pro code by email" data-he="קבל קוד Pro במייל">Get your Pro code by email</span><br>
        <b style="color:var(--tx)">3.</b> <span data-en="Enter code to unlock" data-he="הכנס קוד לפתיחה">Enter code to unlock</span>
      </div>
      <a href="https://www.paypal.com/ncp/payment/2LA7B7PZTHN54" target="_blank" rel="noopener" class="btn btn-primary" style="width:100%;justify-content:center;margin-bottom:8px;min-height:48px;" data-en="Pay with PayPal — $14.99" data-he="שלם ב-PayPal — $14.99">Pay with PayPal — $14.99</a>
      <button onclick="this.closest('.modal-overlay').remove();openCryptoModal()" class="btn" style="width:100%;justify-content:center;margin-bottom:8px;min-height:48px;border-color:rgba(81,207,102,.3);color:var(--grn);" data-en="Pay with Crypto — 35% OFF → $9.74" data-he="שלם בקריפטו — 35% הנחה → $9.74">Pay with Crypto — 35% OFF → $9.74</button>
      <a href="/auth.html" class="btn" style="width:100%;justify-content:center;min-height:48px;" data-en="I have a code" data-he="יש לי קוד">I have a code</a>
      <button onclick="this.closest('.modal-overlay').remove()" style="margin-top:12px;background:none;border:none;color:var(--txd);cursor:pointer;font-size:14px;font-family:inherit;min-height:48px;padding:8px 16px;" data-en="Maybe later" data-he="אולי אחר כך">Maybe later</button>
    </div>`;
  document.body.appendChild(m);
  requestAnimationFrame(() => m.classList.add('open'));
  setLang(lang); // refresh text
}
