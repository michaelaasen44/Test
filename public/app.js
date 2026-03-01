'use strict';

// ── Tab navigation ─────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
  });
});

// ── eBay deal finder ───────────────────────────────────────────────────────
const form       = document.getElementById('searchForm');
const input      = document.getElementById('searchInput');
const resultsEl  = document.getElementById('results');
const statusBar  = document.getElementById('statusBar');
const searchBtn  = document.getElementById('searchBtn');

// Startup: warn if eBay isn't configured
fetch('/api/health')
  .then(r => r.json())
  .then(({ ebayConfigured }) => {
    if (!ebayConfigured) {
      showStatus(
        statusBar,
        '&#9888; eBay API not configured. Copy <code>.env.example</code> to <code>.env</code>, add your keys, and restart the server.',
        'error'
      );
    }
  })
  .catch(() => {});

form.addEventListener('submit', async e => {
  e.preventDefault();

  const query = input.value.trim();
  if (!query) return;

  const types = [...document.querySelectorAll('input[name="types"]:checked')]
    .map(el => el.value);

  if (!types.length) {
    showStatus(statusBar, 'Select at least one deal type to hunt for.', 'error');
    return;
  }

  setLoading(searchBtn, true, 'Searching…', 'Find Deals');
  showStatus(statusBar, 'Searching eBay across all deal signals…', 'loading');

  try {
    const params = new URLSearchParams({ q: query, types: types.join(',') });
    const res  = await fetch(`/api/search?${params}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    renderDeals(data.deals, data.query);
    showStatus(
      statusBar,
      data.total
        ? `&#128293; Found <strong>${data.total}</strong> deal${data.total !== 1 ? 's' : ''} for &ldquo;${esc(data.query)}&rdquo;`
        : `No deals found for &ldquo;${esc(data.query)}&rdquo;`,
      data.total ? 'success' : 'info'
    );
  } catch (err) {
    showStatus(statusBar, `Error: ${esc(err.message)}`, 'error');
    resultsEl.innerHTML = '';
  } finally {
    setLoading(searchBtn, false, 'Searching…', 'Find Deals');
  }
});

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

// ── Gov Auctions ───────────────────────────────────────────────────────────
const govForm      = document.getElementById('govSearchForm');
const govInput     = document.getElementById('govSearchInput');
const govResultsEl = document.getElementById('govResults');
const govStatusBar = document.getElementById('govStatusBar');
const govSearchBtn = document.getElementById('govSearchBtn');

govForm.addEventListener('submit', async e => {
  e.preventDefault();

  const query = govInput.value.trim();
  const states = [...document.querySelectorAll('input[name="govState"]:checked')]
    .map(el => el.value);

  if (!states.length) {
    showStatus(govStatusBar, 'Select at least one state.', 'error');
    return;
  }

  setLoading(govSearchBtn, true, 'Searching…', 'Find Auctions');
  showStatus(govStatusBar, 'Searching GSA Auctions &amp; GovDeals across selected states…', 'loading');

  try {
    const params = new URLSearchParams({ states: states.join(',') });
    if (query) params.set('q', query);
    const res  = await fetch(`/api/gov-auctions?${params}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    renderGovAuctions(data.auctions, query, states);
    showStatus(
      govStatusBar,
      data.total
        ? `&#127963; Found <strong>${data.total}</strong> auction${data.total !== 1 ? 's' : ''}${query ? ` for &ldquo;${esc(query)}&rdquo;` : ''} across ${states.length} state${states.length !== 1 ? 's' : ''}`
        : `No auctions found${query ? ` for &ldquo;${esc(query)}&rdquo;` : ''}. Try different states or a broader keyword.`,
      data.total ? 'success' : 'info'
    );
  } catch (err) {
    showStatus(govStatusBar, `Error: ${esc(err.message)}`, 'error');
    govResultsEl.innerHTML = '';
  } finally {
    setLoading(govSearchBtn, false, 'Searching…', 'Find Auctions');
  }
});

function renderGovAuctions(auctions, query, states) {
  if (!auctions.length) {
    govResultsEl.innerHTML = `
      <div class="no-results">
        <div class="empty-icon">&#127963;</div>
        <h2>No auctions found${query ? ` for &ldquo;${esc(query)}&rdquo;` : ''}</h2>
        <p>Try a broader keyword, select more states, or check back later for new listings.</p>
      </div>`;
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'results-grid';
  auctions.forEach(auction => grid.appendChild(buildGovCard(auction)));

  govResultsEl.innerHTML = '';
  govResultsEl.appendChild(grid);
}

function buildGovCard(auction) {
  const card = document.createElement('article');
  card.className = 'deal-card gov-card';

  const sourceClass = auction.source === 'GSA' ? 'gsa' : 'govdeals';
  const sourceLabel = auction.source === 'GSA' ? '&#127963; GSA Federal' : '&#127963; GovDeals';

  const bidHtml = auction.currentBid > 0
    ? `<span class="card-price">$${Number(auction.currentBid).toFixed(2)}</span><span class="card-avg">current bid</span>`
    : `<span class="card-price-none">No bids yet</span>`;

  const locationHtml = auction.location
    ? `<p class="card-location">&#128205; ${esc(auction.location)}</p>`
    : '';

  const endHtml = auction.endDate
    ? `<span class="tag endingSoon">${esc(formatEndDate(auction.endDate))}</span>`
    : '';

  const categoryHtml = auction.category
    ? `<span class="tag belowAverage">${esc(auction.category.slice(0, 40))}</span>`
    : '';

  const safeUrl = safeGovUrl(auction.url);

  card.innerHTML = `
    <div class="card-body">
      <div class="gov-source-row">
        <span class="tag ${sourceClass}">${sourceLabel}</span>
        ${endHtml}
      </div>
      <p class="card-title">${esc(auction.title)}</p>
      <div class="card-price-row">${bidHtml}</div>
      ${locationHtml}
      <div class="card-tags">${categoryHtml}</div>
    </div>
    <div class="card-footer">
      <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="view-btn">
        View Auction &#8594;
      </a>
    </div>`;

  return card;
}

function formatEndDate(raw) {
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return `Ends: ${raw}`;
    const now = Date.now();
    const diffMs = d.getTime() - now;
    if (diffMs < 0) return 'Ended';
    const diffH = diffMs / 3600000;
    if (diffH < 24) return `Ends in ${Math.round(diffH)}h`;
    const diffD = Math.round(diffH / 24);
    return `Ends in ${diffD}d`;
  } catch {
    return `Ends: ${raw}`;
  }
}

// ── Shared UI helpers ──────────────────────────────────────────────────────
function setLoading(btn, on, loadingText, idleText) {
  btn.disabled = on;
  btn.querySelector('.btn-text').textContent = on ? loadingText : idleText;
}

function showStatus(bar, html, type = 'info') {
  bar.className = `status-bar ${type}`;
  bar.innerHTML = type === 'loading'
    ? `<div class="spinner"></div>${html}`
    : html;
}

// ── Utilities ──────────────────────────────────────────────────────────────
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

function safeGovUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol === 'https:' &&
        (u.hostname.endsWith('govdeals.com') ||
         u.hostname.endsWith('gsaauctions.gov') ||
         u.hostname.endsWith('gsa.gov') ||
         u.hostname.endsWith('data.gov'))) {
      return url;
    }
  } catch {}
  return '#';
}
