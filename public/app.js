'use strict';

const form       = document.getElementById('searchForm');
const input      = document.getElementById('searchInput');
const resultsEl  = document.getElementById('results');
const statusBar  = document.getElementById('statusBar');
const searchBtn  = document.getElementById('searchBtn');

// ── Startup: warn if eBay isn't configured ────────────────────────────────
fetch('/api/health')
  .then(r => r.json())
  .then(({ ebayConfigured }) => {
    if (!ebayConfigured) {
      showStatus(
        '&#9888; eBay API not configured. Copy <code>.env.example</code> to <code>.env</code>, add your keys, and restart the server.',
        'error'
      );
    }
  })
  .catch(() => {});

// ── Search submit ─────────────────────────────────────────────────────────
form.addEventListener('submit', async e => {
  e.preventDefault();

  const query = input.value.trim();
  if (!query) return;

  const types = [...document.querySelectorAll('input[name="types"]:checked')]
    .map(el => el.value);

  if (!types.length) {
    showStatus('Select at least one deal type to hunt for.', 'error');
    return;
  }

  setLoading(true);
  showStatus('Searching eBay across all deal signals…', 'loading');

  try {
    const params = new URLSearchParams({ q: query, types: types.join(',') });
    const res  = await fetch(`/api/search?${params}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    renderDeals(data.deals, data.query);
    showStatus(
      data.total
        ? `&#128293; Found <strong>${data.total}</strong> deal${data.total !== 1 ? 's' : ''} for &ldquo;${esc(data.query)}&rdquo;`
        : `No deals found for &ldquo;${esc(data.query)}&rdquo;`,
      data.total ? 'success' : 'info'
    );
  } catch (err) {
    showStatus(`Error: ${esc(err.message)}`, 'error');
    resultsEl.innerHTML = '';
  } finally {
    setLoading(false);
  }
});

// ── UI helpers ────────────────────────────────────────────────────────────
function setLoading(on) {
  searchBtn.disabled = on;
  searchBtn.querySelector('.btn-text').textContent = on ? 'Searching…' : 'Find Deals';
}

function showStatus(html, type = 'info') {
  statusBar.className = `status-bar ${type}`;
  statusBar.innerHTML = type === 'loading'
    ? `<div class="spinner"></div>${html}`
    : html;
}

// ── Render results ────────────────────────────────────────────────────────
function renderDeals(deals, query) {
  if (!deals.length) {
    resultsEl.innerHTML = `
      <div class="no-results">
        <div class="empty-icon">&#128269;</div>
        <h2>No deals found for &ldquo;${esc(query)}&rdquo;</h2>
        <p>Try broadening your search term or enabling more deal types.</p>
      </div>`;
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'results-grid';
  deals.forEach(deal => grid.appendChild(buildCard(deal)));

  resultsEl.innerHTML = '';
  resultsEl.appendChild(grid);
}

function buildCard(deal) {
  const card = document.createElement('article');
  card.className = 'deal-card';

  const scoreClass = deal.score >= 60 ? 'high' : deal.score >= 35 ? 'medium' : 'low';

  const imgHtml = deal.image
    ? `<img src="${esc(deal.image)}" alt="${esc(deal.title)}" loading="lazy"
          onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'no-image',innerHTML:'&#128230;'}))">`
    : `<div class="no-image">&#128230;</div>`;

  const tagsHtml = deal.reasons.map(r => {
    const cls = r.type === 'endingSoon' && r.label.includes('0 bid')
      ? 'endingSoon'
      : r.type === 'endingSoon' && !r.label.includes('0 bid')
        ? 'endingSoon fewBids'
        : r.type;
    return `<span class="tag ${cls}">${esc(r.label)}</span>`;
  }).join('');

  const avgHtml = deal.avgPrice > 0 && deal.avgPrice !== deal.price
    ? `<span class="card-avg">avg $${deal.avgPrice.toFixed(2)}</span>`
    : '';

  const condHtml = deal.condition ? `${esc(deal.condition)} &middot; ` : '';
  const safeUrl  = safeEbayUrl(deal.url);

  card.innerHTML = `
    <div class="card-img">
      ${imgHtml}
      <div class="score-badge ${scoreClass}">&#9889; ${deal.score}</div>
    </div>
    <div class="card-body">
      <p class="card-title">${esc(deal.title)}</p>
      <div class="card-price-row">
        <span class="card-price">$${Number(deal.price).toFixed(2)}</span>
        ${avgHtml}
      </div>
      <div class="card-tags">${tagsHtml}</div>
      <p class="card-meta">${condHtml}${esc(deal.seller.name)} &middot; ${esc(deal.seller.feedbackPct)}% feedback</p>
    </div>
    <div class="card-footer">
      <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="view-btn">
        View on eBay &#8594;
      </a>
    </div>`;

  return card;
}

// ── Utilities ─────────────────────────────────────────────────────────────
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeEbayUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol === 'https:' && u.hostname.endsWith('ebay.com')) return url;
  } catch {}
  return '#';
}
