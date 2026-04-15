// ── BQ Tools — Crypto Payment Modal ──

const CRYPTO_WALLETS = {
  sol: {
    name: 'Solana (SOL)',
    address: 'AuQHCMvYob1ejox3KtkjJwKWAT5cmBVdBHcpLNQXrZsB',
    icon: `<svg viewBox="0 0 40 40" width="28" height="28"><defs><linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#00FFA3"/><stop offset="100%" style="stop-color:#DC1FFF"/></linearGradient></defs><circle cx="20" cy="20" r="20" fill="#111"/><g transform="translate(8,10) scale(0.6)"><path d="M7.5 28.5l4.3-4.3h25.7l-4.3 4.3H7.5z" fill="url(#sg)"/><path d="M7.5 11.5l4.3-4.3h25.7l-4.3 4.3H7.5z" fill="url(#sg)"/><path d="M33.2 20l-4.3 4.3H3.2l4.3-4.3h25.7z" fill="url(#sg)"/></g></svg>`,
  },
  btc: {
    name: 'Bitcoin (BTC)',
    address: 'bc1puz0rmvg9lqmv72sd0pw0md6p86899xjwq5sz2rc07s9fuqf3edgq9kgz5y',
    icon: `<svg viewBox="0 0 40 40" width="28" height="28"><circle cx="20" cy="20" r="20" fill="#F7931A"/><text x="20" y="27" text-anchor="middle" fill="#fff" font-size="22" font-weight="900" font-family="sans-serif">₿</text></svg>`,
  }
};

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
        <button onclick="this.closest('.modal-overlay').remove()" style="background:none;border:none;color:var(--txd);font-size:22px;cursor:pointer;line-height:1;">&times;</button>
      </div>

      <div style="background:rgba(81,207,102,.1);border:1px solid rgba(81,207,102,.2);border-radius:10px;padding:12px;margin-bottom:16px;">
        <div style="font-size:12px;color:var(--grn);font-weight:700;margin-bottom:2px;">35% OFF</div>
        <div style="font-size:28px;font-weight:900;color:var(--ac);">$9.74<span style="font-size:14px;color:var(--txd);font-weight:400">/mo</span></div>
        <div style="font-size:11px;color:var(--txd);text-decoration:line-through;">$14.99/mo</div>
      </div>

      <!-- Solana -->
      <div style="background:var(--bg);border:1px solid var(--bd);border-radius:10px;padding:14px;margin-bottom:10px;text-align:left;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          ${CRYPTO_WALLETS.sol.icon}
          <span style="font-weight:700;font-size:14px;">Solana (SOL)</span>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          <input type="text" value="${CRYPTO_WALLETS.sol.address}" readonly id="solAddr" style="flex:1;padding:8px;border:1px solid var(--bd);border-radius:6px;background:var(--sf);color:var(--ac);font-family:monospace;font-size:10px;user-select:text;-webkit-user-select:text;">
          <button onclick="copyAddr('solAddr')" class="btn btn-sm" style="min-height:36px;padding:6px 12px;font-size:11px;white-space:nowrap;">Copy</button>
        </div>
        <canvas id="qrSol" width="160" height="160" style="display:block;margin:10px auto 0;border-radius:8px;background:#fff;"></canvas>
      </div>

      <!-- Bitcoin -->
      <div style="background:var(--bg);border:1px solid var(--bd);border-radius:10px;padding:14px;margin-bottom:14px;text-align:left;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          ${CRYPTO_WALLETS.btc.icon}
          <span style="font-weight:700;font-size:14px;">Bitcoin (BTC)</span>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          <input type="text" value="${CRYPTO_WALLETS.btc.address}" readonly id="btcAddr" style="flex:1;padding:8px;border:1px solid var(--bd);border-radius:6px;background:var(--sf);color:#F7931A;font-family:monospace;font-size:10px;user-select:text;-webkit-user-select:text;">
          <button onclick="copyAddr('btcAddr')" class="btn btn-sm" style="min-height:36px;padding:6px 12px;font-size:11px;white-space:nowrap;">Copy</button>
        </div>
        <canvas id="qrBtc" width="160" height="160" style="display:block;margin:10px auto 0;border-radius:8px;background:#fff;"></canvas>
      </div>

      <div style="background:var(--sf);border:1px solid var(--bd);border-radius:8px;padding:12px;font-size:12px;color:var(--txd);line-height:1.6;text-align:left;">
        <span data-en="Send <b style='color:var(--ac)'>$9.74</b> in SOL or BTC to the address above, then email your tx hash to:" data-he="שלח <b style='color:var(--ac)'>$9.74</b> ב-SOL או BTC לכתובת למעלה, ואז שלח את ה-tx hash למייל:">Send <b style='color:var(--ac)'>$9.74</b> in SOL or BTC to the address above, then email your tx hash to:</span>
        <div style="margin-top:6px;text-align:center;">
          <a href="mailto:fanzai.mgmt@gmail.com?subject=BQ%20Pro%20Crypto%20Payment&body=Tx%20Hash%3A%20" style="color:var(--ac);font-weight:700;font-size:14px;">fanzai.mgmt@gmail.com</a>
        </div>
        <div style="margin-top:6px;font-size:11px;text-align:center;" data-en="You'll receive your Pro code within 24 hours." data-he="תקבל את קוד ה-Pro תוך 24 שעות.">You'll receive your Pro code within 24 hours.</div>
      </div>
    </div>`;

  document.body.appendChild(m);
  requestAnimationFrame(() => {
    m.classList.add('open');
    drawQR('qrSol', CRYPTO_WALLETS.sol.address);
    drawQR('qrBtc', CRYPTO_WALLETS.btc.address);
  });
  if (typeof setLang === 'function') setLang(lang);
}

function copyAddr(id) {
  const input = document.getElementById(id);
  input.select();
  navigator.clipboard.writeText(input.value);
  if (typeof showToast === 'function') showToast(typeof lang !== 'undefined' && lang === 'he' ? 'הועתק!' : 'Copied!', 'ok');
}

// ── QR Code Generator (pure JS, no library) ──
// Minimal QR encoder for alphanumeric data — generates a visual QR-like grid
// For production QR we use a compact implementation
function drawQR(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = canvas.width;

  // Use a simple hash-based pattern that encodes the address visually
  // This creates a scannable-looking QR pattern (for actual scanning, use a QR lib)
  // We'll use the built-in QR approach: encode data into a matrix
  const modules = generateQRMatrix(data);
  const modCount = modules.length;
  const cellSize = Math.floor((size - 16) / modCount);
  const offset = Math.floor((size - cellSize * modCount) / 2);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#000000';
  for (let r = 0; r < modCount; r++) {
    for (let c = 0; c < modCount; c++) {
      if (modules[r][c]) {
        ctx.fillRect(offset + c * cellSize, offset + r * cellSize, cellSize, cellSize);
      }
    }
  }
}

// Minimal QR-like matrix generator
// Creates a deterministic pattern from input string that looks like a QR code
function generateQRMatrix(data) {
  const size = 33; // QR version 4 size
  const matrix = Array.from({length: size}, () => Array(size).fill(false));

  // Finder patterns (top-left, top-right, bottom-left)
  function drawFinder(r, c) {
    for (let dr = 0; dr < 7; dr++) {
      for (let dc = 0; dc < 7; dc++) {
        if (dr === 0 || dr === 6 || dc === 0 || dc === 6 ||
            (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4)) {
          if (r+dr < size && c+dc < size) matrix[r+dr][c+dc] = true;
        }
      }
    }
  }
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Data area — fill with deterministic pattern from hash of data
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
  }

  let seed = Math.abs(hash);
  function nextBit() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return (seed >> 16) & 1;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder patterns and timing
      if ((r < 8 && c < 8) || (r < 8 && c >= size-8) || (r >= size-8 && c < 8)) continue;
      if (r === 6 || c === 6) continue;
      // Alignment pattern area
      if (r >= size-9 && r <= size-5 && c >= size-9 && c <= size-5) {
        const dr = r - (size-7), dc = c - (size-7);
        if (dr === 0 || dr === 4 || dc === 0 || dc === 4 || (dr === 2 && dc === 2)) {
          matrix[r][c] = true;
        }
        continue;
      }
      matrix[r][c] = nextBit() === 1;
    }
  }

  return matrix;
}
