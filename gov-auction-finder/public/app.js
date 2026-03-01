'use strict';

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
    ? `<span class="tag category">${esc(auction.category.slice(0, 40))}</span>`
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

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
