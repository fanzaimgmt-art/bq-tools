// ── BQ Tools — Crypto Payment Modal ──

const CRYPTO_WALLETS = {
  sol: {
    name: 'Solana (SOL)',
    address: 'AuQHCMvYob1ejox3KtkjJwKWAT5cmBVdBHcpLNQXrZsB',
    color: '#9945FF',
    icon: `<svg viewBox="0 0 40 40" width="28" height="28"><defs><linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#00FFA3"/><stop offset="100%" style="stop-color:#DC1FFF"/></linearGradient></defs><circle cx="20" cy="20" r="20" fill="#111"/><g transform="translate(8,10) scale(0.6)"><path d="M7.5 28.5l4.3-4.3h25.7l-4.3 4.3H7.5z" fill="url(#sg)"/><path d="M7.5 11.5l4.3-4.3h25.7l-4.3 4.3H7.5z" fill="url(#sg)"/><path d="M33.2 20l-4.3 4.3H3.2l4.3-4.3h25.7z" fill="url(#sg)"/></g></svg>`,
  },
  btc: {
    name: 'Bitcoin (BTC)',
    address: 'bc1puz0rmvg9lqmv72sd0pw0md6p86899xjwq5sz2rc07s9fuqf3edgq9kgz5y',
    color: '#F7931A',
    icon: `<svg viewBox="0 0 40 40" width="28" height="28"><circle cx="20" cy="20" r="20" fill="#F7931A"/><text x="20" y="27" text-anchor="middle" fill="#fff" font-size="22" font-weight="900" font-family="sans-serif">&#x20BF;</text></svg>`,
  }
};

function qrUrl(data) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&bgcolor=ffffff&color=000000&data=${encodeURIComponent(data)}`;
}

function walletBlock(coin) {
  const w = CRYPTO_WALLETS[coin];
  const id = coin + 'Addr';
  return `
    <div style="background:var(--bg);border:1px solid var(--bd);border-radius:10px;padding:16px;margin-bottom:10px;text-align:left;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        ${w.icon}
        <span style="font-weight:700;font-size:15px;">${w.name}</span>
      </div>
      <div style="display:flex;gap:6px;align-items:center;">
        <input type="text" value="${w.address}" readonly id="${id}"
          style="flex:1;padding:10px;border:1px solid var(--bd);border-radius:6px;background:var(--sf);color:${w.color};font-family:monospace;font-size:11px;user-select:text;-webkit-user-select:text;overflow:hidden;text-overflow:ellipsis;">
        <button onclick="copyAddr('${id}')" class="btn" style="min-height:48px;padding:8px 16px;font-size:14px;white-space:nowrap;">Copy</button>
      </div>
      <img src="${qrUrl(w.address)}" alt="QR code for ${w.name}" width="160" height="160"
        style="display:block;margin:12px auto 0;border-radius:8px;background:#fff;image-rendering:pixelated;">
    </div>`;
}

function openCryptoModal() {
  const old = document.getElementById('cryptoModal');
  if (old) old.remove();

  const m = document.createElement('div');
  m.id = 'cryptoModal';
  m.className = 'modal-overlay';
  m.innerHTML = `
    <div class="modal-card" style="max-width:460px;text-align:center;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 style="color:var(--ac);margin:0;font-size:18px;" data-en="Pay with Crypto" data-he="שלם בקריפטו">Pay with Crypto</h3>
        <button onclick="this.closest('.modal-overlay').remove()" style="background:none;border:none;color:var(--txd);font-size:28px;cursor:pointer;line-height:1;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">&times;</button>
      </div>

      <div style="background:rgba(81,207,102,.1);border:1px solid rgba(81,207,102,.2);border-radius:10px;padding:14px;margin-bottom:16px;">
        <div style="font-size:14px;color:var(--grn);font-weight:700;margin-bottom:2px;">35% OFF</div>
        <div style="font-size:28px;font-weight:900;color:var(--ac);">$9.74<span style="font-size:14px;color:var(--txd);font-weight:400">/mo</span></div>
        <div style="font-size:14px;color:var(--txd);text-decoration:line-through;">$14.99/mo</div>
      </div>

      ${walletBlock('sol')}
      ${walletBlock('btc')}

      <div style="background:var(--sf);border:1px solid var(--bd);border-radius:8px;padding:14px;font-size:14px;color:var(--txd);line-height:1.7;text-align:left;">
        <span data-en="Send <b style='color:var(--ac)'>$9.74</b> in SOL or BTC to the address above, then email your tx hash to:" data-he="שלח <b style='color:var(--ac)'>$9.74</b> ב-SOL או BTC לכתובת למעלה, ואז שלח את ה-tx hash למייל:">Send <b style="color:var(--ac)">$9.74</b> in SOL or BTC to the address above, then email your tx hash to:</span>
        <div style="margin-top:8px;text-align:center;">
          <a href="mailto:fanzai.mgmt@gmail.com?subject=BQ%20Pro%20Crypto%20Payment&body=Tx%20Hash%3A%20" style="color:var(--ac);font-weight:700;font-size:16px;">fanzai.mgmt@gmail.com</a>
        </div>
        <div style="margin-top:8px;font-size:14px;text-align:center;" data-en="You'll receive your Pro code within 24 hours." data-he="תקבל את קוד ה-Pro תוך 24 שעות.">You'll receive your Pro code within 24 hours.</div>
      </div>
    </div>`;

  document.body.appendChild(m);
  requestAnimationFrame(() => m.classList.add('open'));
  if (typeof setLang === 'function') setLang(lang);
}

function copyAddr(id) {
  const input = document.getElementById(id);
  input.select();
  navigator.clipboard.writeText(input.value);
  if (typeof showToast === 'function') showToast(typeof lang !== 'undefined' && lang === 'he' ? 'הועתק!' : 'Copied!', 'ok');
}
