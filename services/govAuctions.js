'use strict';

const axios = require('axios');
const cheerio = require('cheerio');

const STL_RADIUS_STATES = ['MO', 'IL', 'KY', 'IN', 'TN', 'AR', 'KS', 'IA', 'OK'];

const STATE_NAMES = {
  MO: 'Missouri', IL: 'Illinois', KY: 'Kentucky', IN: 'Indiana',
  TN: 'Tennessee', AR: 'Arkansas', KS: 'Kansas', IA: 'Iowa', OK: 'Oklahoma',
};

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

// ── GSA Auctions API ─────────────────────────────────────────────────────────
async function searchGSA(keyword, states) {
  try {
    const params = { format: 'json' };
    const resp = await axios.get('https://api.data.gov/gsa/auctions', {
      params,
      timeout: 10000,
    });

    const raw = resp.data;
    // GSA returns an object with a nested array — try common shapes
    const items = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.auctions)
        ? raw.auctions
        : Array.isArray(raw?.Auctions)
          ? raw.Auctions
          : [];

    const stateSet = new Set(states.map(s => s.toUpperCase()));

    return items
      .filter(item => {
        const st = (item.State || item.state || item.StateCode || '').toUpperCase().trim();
        return stateSet.has(st);
      })
      .filter(item => {
        if (!keyword) return true;
        const title = (item.ItemName || item.itemName || item.title || item.Title || '').toLowerCase();
        return title.includes(keyword.toLowerCase());
      })
      .map(item => normalizeGSA(item));
  } catch (err) {
    console.warn('GSA Auctions fetch failed:', err.message);
    return [];
  }
}

function normalizeGSA(item) {
  const id = String(item.SaleNo || item.saleNo || item.AuctionId || item.auctionId || Math.random());
  const lotNo = item.LotNo || item.lotNo || '';
  return {
    id: `gsa-${id}-${lotNo}`,
    title: item.ItemName || item.itemName || item.Title || item.title || 'Untitled Item',
    currentBid: parseFloat(item.CurrentBidAmt || item.currentBidAmt || item.CurrentBid || 0) || 0,
    location: [item.City || item.city, item.State || item.state].filter(Boolean).join(', '),
    state: (item.State || item.state || '').toUpperCase(),
    endDate: item.SaleEndDt || item.saleEndDt || item.AuctionEndDate || item.auctionEndDate || null,
    url: item.AuctionUrl || item.auctionUrl || item.Url || item.url
      || `https://www.gsaauctions.gov/gsaauctions/aucindx`,
    source: 'GSA',
    category: item.Description || item.description || item.Category || item.category || '',
    image: null,
  };
}

// ── GovDeals Scraper ─────────────────────────────────────────────────────────
async function searchGovDeals(keyword, states) {
  const results = [];
  const seen = new Set();

  for (const state of states) {
    try {
      const params = {
        'fa': 'Main.AdvSearchResultsNew',
        'kWord': keyword || '',
        'kWordSelect': '1',
        'category': '0',
        'stateCode': state,
        'country': 'US',
        'agency': '0',
        'timing': 'all',
        'sortBy': 'td',
        'recsPerPg': '40',
      };

      const url = 'https://www.govdeals.com/index.cfm';
      const resp = await axios.get(url, {
        params,
        headers: BROWSER_HEADERS,
        timeout: 12000,
      });

      const items = parseGovDealsPage(resp.data, state);
      for (const item of items) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          results.push(item);
        }
      }

      // Small delay between state requests to be polite
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (err) {
      console.warn(`GovDeals fetch failed for ${state}:`, err.message);
    }
  }

  return results;
}

function parseGovDealsPage(html, state) {
  const $ = cheerio.load(html);
  const items = [];

  // GovDeals listing rows — try multiple selectors for robustness
  const rows = $('tr.even, tr.odd, .searchResultRow, tr[class*="result"]');

  rows.each((_i, el) => {
    const row = $(el);

    const titleEl = row.find('a.itemTitle, a[href*="asset"], td.itemTitle a').first();
    const title = titleEl.text().trim();
    if (!title) return;

    const href = titleEl.attr('href') || '';
    const fullUrl = href.startsWith('http') ? href : `https://www.govdeals.com${href}`;

    // Extract numeric ID from URL like /asset/12345/678
    const idMatch = fullUrl.match(/asset\/(\d+)\/(\d+)/);
    const id = idMatch ? `govdeals-${idMatch[1]}-${idMatch[2]}` : `govdeals-${Buffer.from(fullUrl).toString('base64').slice(0, 16)}`;

    const bidText = row.find('.currentBid, td.bid, td:contains("$")').first().text();
    const bidMatch = bidText.match(/\$[\d,]+\.?\d*/);
    const currentBid = bidMatch ? parseFloat(bidMatch[0].replace(/[$,]/g, '')) : 0;

    const locationText = row.find('.location, td.location').first().text().trim()
      || `${STATE_NAMES[state] || state}`;

    const endText = row.find('.auctionEnd, .endDate, td.endDate, td:contains("End")').first().text().trim();

    const category = row.find('.category, td.category').first().text().trim();

    items.push({
      id,
      title,
      currentBid,
      location: locationText,
      state,
      endDate: endText || null,
      url: fullUrl,
      source: 'GovDeals',
      category,
      image: null,
    });
  });

  return items;
}

// ── Main export ──────────────────────────────────────────────────────────────
async function findGovAuctions(keyword, states) {
  const validStates = states.filter(s => STL_RADIUS_STATES.includes(s));
  if (!validStates.length) return [];

  const [gsaItems, govDealsItems] = await Promise.all([
    searchGSA(keyword, validStates),
    searchGovDeals(keyword, validStates),
  ]);

  // Merge and deduplicate
  const seen = new Set();
  const all = [];
  for (const item of [...gsaItems, ...govDealsItems]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      all.push(item);
    }
  }

  // Sort: ending soonest first (nulls last), then by lowest bid
  all.sort((a, b) => {
    const da = a.endDate ? new Date(a.endDate).getTime() : Infinity;
    const db = b.endDate ? new Date(b.endDate).getTime() : Infinity;
    if (da !== db) return da - db;
    return a.currentBid - b.currentBid;
  });

  return all.slice(0, 60);
}

module.exports = { findGovAuctions, STL_RADIUS_STATES, STATE_NAMES };
