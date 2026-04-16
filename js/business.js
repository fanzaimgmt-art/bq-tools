// ── Business Operations — Shared Helpers ──

// Generic CRUD wrapper for business collections
const Biz = {
  async list(collection) {
    const data = await apiCall(`/api/${collection}`);
    return data.items || [];
  },
  async get(collection, id) {
    const data = await apiCall(`/api/${collection}/${id}`);
    return data.item;
  },
  async create(collection, item) {
    const data = await apiCall(`/api/${collection}`, { method: 'POST', body: item });
    return data.item;
  },
  async update(collection, id, updates) {
    const data = await apiCall(`/api/${collection}/${id}`, { method: 'PUT', body: updates });
    return data.item;
  },
  async delete(collection, id) {
    return apiCall(`/api/${collection}/${id}`, { method: 'DELETE' });
  },
};

// HTML escape
function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

// Format currency
function fmtMoney(n) {
  const v = parseFloat(n) || 0;
  return '$' + v.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

// Format date
function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d)) return s;
  return d.toLocaleDateString();
}

// Format date short (Jan 5)
function fmtDateShort(s) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d)) return s;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// CSV export
function exportCSV(filename, rows, columns) {
  const headers = columns.map(c => c.label).join(',');
  const data = rows.map(r => columns.map(c => {
    let v = typeof c.key === 'function' ? c.key(r) : r[c.key];
    if (v == null) v = '';
    v = String(v).replace(/"/g, '""');
    if (v.includes(',') || v.includes('\n') || v.includes('"')) v = `"${v}"`;
    return v;
  }).join(',')).join('\n');
  const csv = headers + '\n' + data;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Resize image to 200px thumbnail
async function makeThumbnail(dataUrl, maxSize = 200) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      const scale = Math.min(maxSize / w, maxSize / h, 1);
      w = Math.round(w * scale); h = Math.round(h * scale);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', 0.75));
    };
    img.src = dataUrl;
  });
}

// Month start / end helpers
function monthStart(d = new Date()) {
  const m = new Date(d); m.setDate(1); m.setHours(0, 0, 0, 0); return m;
}
function monthEnd(d = new Date()) {
  const m = new Date(d); m.setMonth(m.getMonth() + 1); m.setDate(0); m.setHours(23, 59, 59, 999); return m;
}

// Confirm delete
function confirmDelete(label = 'this item') {
  return confirm((lang === 'he' ? 'למחוק את ' : 'Delete ') + label + '?');
}

// Simple tag chip
function tagChip(text, color = 'var(--ac)') {
  return `<span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;background:${color}22;color:${color};margin-inline-end:4px;">${escHtml(text)}</span>`;
}

// Get cache of other collections (for dropdowns)
const BizCache = {
  _data: {},
  async get(collection) {
    if (!this._data[collection]) {
      this._data[collection] = await Biz.list(collection);
    }
    return this._data[collection];
  },
  invalidate(collection) { delete this._data[collection]; }
};

// Page skeleton: common header + how-it-works + content container
function buildBizPage({ title, titleEn, titleHe, subEn, subHe, hiwConfig, contentId }) {
  return `
    <div class="page">
      <a href="/business.html" class="page-back" data-en="← Business Hub" data-he="← מרכז עסקי">← Business Hub</a>
      <h1 class="page-title" data-en="${titleEn}" data-he="${titleHe}">${title}</h1>
      <p class="page-sub" data-en="${subEn}" data-he="${subHe}">${subEn}</p>
      <div id="hiw-biz"></div>
      <div id="${contentId}"></div>
    </div>
    <script>
      if (typeof buildHowItWorks === 'function' && ${JSON.stringify(hiwConfig)}) {
        buildHowItWorks('hiw-biz', ${JSON.stringify(hiwConfig)});
      }
    </script>`;
}
