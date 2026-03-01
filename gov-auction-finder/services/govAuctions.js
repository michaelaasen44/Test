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
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
};

// ── GSA Auctions (gsaauctions.gov scrape) ────────────────────────────────────
async function searchGSA(keyword, states) {
  try {
    // GSA fleet/surplus search
    const params = {
      sp:     'ns',
      sf:     'dt',
      so:     'A',
      satype: 'S',
      search: keyword || '',
    };

    const resp = await axios.get('https://www.gsaauctions.gov/gsaauctions/aucSrch', {
      params,
      headers: BROWSER_HEADERS,
      timeout: 12000,
    });

    return parseGSAPage(resp.data, states, keyword);
  } catch (err) {
    console.warn('GSA scrape failed:', err.message, err.response?.status);
    return [];
  }
}

function parseGSAPage(html, states, keyword) {
  const $ = cheerio.load(html);
  const stateSet = new Set(states.map(s => s.toUpperCase()));
  const items = [];

  // GSA uses a table with class "auctionTable" or similar
  $('table tr').each((_i, el) => {
    const row = $(el);
    const cells = row.find('td');
    if (cells.length < 3) return;

    const titleEl = row.find('a').first();
    const title = titleEl.text().trim();
    if (!title || title.length < 4) return;

    // State is typically in one of the cells
    const rowText = row.text();
    const stateMatch = rowText.match(/\b([A-Z]{2})\b/g) || [];
    const rowState = stateMatch.find(s => STL_RADIUS_STATES.includes(s));
    if (!rowState || !stateSet.has(rowState)) return;

    if (keyword) {
      if (!title.toLowerCase().includes(keyword.toLowerCase())) return;
    }

    const href = titleEl.attr('href') || '';
    const fullUrl = href.startsWith('http') ? href : `https://www.gsaauctions.gov${href}`;
    const id = `gsa-${Buffer.from(fullUrl).toString('base64').slice(0, 20)}`;

    const bidMatch = rowText.match(/\$[\d,]+\.?\d*/);
    const currentBid = bidMatch ? parseFloat(bidMatch[0].replace(/[$,]/g, '')) : 0;

    const dateMatch = rowText.match(/\d{2}\/\d{2}\/\d{4}/);

    items.push({
      id,
      title,
      currentBid,
      location: `${rowState}`,
      state: rowState,
      endDate: dateMatch ? dateMatch[0] : null,
      url: fullUrl,
      source: 'GSA',
      category: '',
      image: null,
    });
  });

  return items;
}

// ── GovDeals Scraper ─────────────────────────────────────────────────────────
async function searchGovDeals(keyword, states) {
  const results = [];
  const seen = new Set();

  for (const state of states) {
    try {
      // Try the current GovDeals search URL
      const resp = await axios.get('https://www.govdeals.com/index.cfm', {
        params: {
          fa:          'Main.AdvSearchResultsNew',
          kWord:       keyword || '',
          kWordSelect: '1',
          category:    '0',
          stateCode:   state,
          country:     'US',
          agency:      '0',
          timing:      'all',
          sortBy:      'td',
          recsPerPg:   '40',
        },
        headers: BROWSER_HEADERS,
        timeout: 15000,
      });

      const $ = cheerio.load(resp.data);

      // 1) Try Next.js / embedded JSON first
      const nextScript = $('#__NEXT_DATA__').html();
      if (nextScript) {
        try {
          const nextData = JSON.parse(nextScript);
          const pp = nextData?.props?.pageProps || {};
          const listings =
            pp?.searchResults?.assets ||
            pp?.assets ||
            pp?.results?.assets ||
            pp?.data ||
            [];

          for (const item of listings) {
            const id = `govdeals-${item.assetId || item.id || item.lotNumber || Math.random()}`;
            if (!seen.has(id)) {
              seen.add(id);
              results.push(normalizeGovDealsJSON(item, state));
            }
          }
        } catch (e) {
          console.warn('GovDeals Next.js JSON parse failed:', e.message);
        }
      }

      // 2) Try card-based layout (their redesign)
      if (!results.length) {
        $('[class*="AssetCard"], [class*="asset-card"], [class*="listing-card"], .result-item').each((_i, el) => {
          const card = $(el);
          const titleEl = card.find('a, h2, h3, [class*="title"]').first();
          const title = titleEl.text().trim();
          if (!title) return;

          const href = titleEl.attr('href') || card.find('a').first().attr('href') || '';
          const fullUrl = href.startsWith('http') ? href : `https://www.govdeals.com${href}`;
          const id = `govdeals-card-${Buffer.from(fullUrl).toString('base64').slice(0, 16)}`;
          if (seen.has(id)) return;
          seen.add(id);

          const bidText = card.find('[class*="bid"], [class*="price"], [class*="amount"]').first().text();
          const bidMatch = bidText.match(/\$[\d,]+\.?\d*/);
          const currentBid = bidMatch ? parseFloat(bidMatch[0].replace(/[$,]/g, '')) : 0;

          const endText = card.find('[class*="end"], [class*="close"], [class*="date"]').first().text().trim();

          results.push({
            id,
            title,
            currentBid,
            location: STATE_NAMES[state] || state,
            state,
            endDate: endText || null,
            url: fullUrl,
            source: 'GovDeals',
            category: '',
            image: card.find('img').first().attr('src') || null,
          });
        });
      }

      // 3) Fall back to old table layout
      if (!results.length) {
        const rows = $('tr.even, tr.odd, .searchResultRow, tr[class*="result"], tr[id*="auction"]');
        rows.each((_i, el) => {
          const row = $(el);
          const titleEl = row.find('a.itemTitle, a[href*="asset"], a[href*="index.cfm"], td.itemTitle a').first();
          const title = titleEl.text().trim();
          if (!title) return;

          const href = titleEl.attr('href') || '';
          const fullUrl = href.startsWith('http') ? href : `https://www.govdeals.com${href}`;
          const idMatch = fullUrl.match(/asset\/(\d+)\/(\d+)/);
          const id = idMatch
            ? `govdeals-${idMatch[1]}-${idMatch[2]}`
            : `govdeals-${Buffer.from(fullUrl).toString('base64').slice(0, 16)}`;
          if (seen.has(id)) return;
          seen.add(id);

          const bidText = row.find('.currentBid, td.bid, td:contains("$")').first().text();
          const bidMatch = bidText.match(/\$[\d,]+\.?\d*/);
          const currentBid = bidMatch ? parseFloat(bidMatch[0].replace(/[$,]/g, '')) : 0;

          const locationText = row.find('.location, td.location').first().text().trim()
            || STATE_NAMES[state] || state;

          const endText = row.find('.auctionEnd, .endDate, td.endDate').first().text().trim();

          results.push({
            id,
            title,
            currentBid,
            location: locationText,
            state,
            endDate: endText || null,
            url: fullUrl,
            source: 'GovDeals',
            category: row.find('.category, td.category').first().text().trim(),
            image: null,
          });
        });
      }

      await new Promise(resolve => setTimeout(resolve, 250));
    } catch (err) {
      console.warn(`GovDeals fetch failed for ${state}:`, err.message, err.response?.status);
    }
  }

  return results;
}

function normalizeGovDealsJSON(item, state) {
  const agencyId = item.agencyId || item.agency_id || '';
  const assetId  = item.assetId  || item.asset_id  || item.id || '';
  return {
    id: `govdeals-${agencyId}-${assetId}`,
    title: item.title || item.name || item.itemName || 'Untitled',
    currentBid: parseFloat(item.currentBid || item.currentBidAmt || item.bidAmount || 0) || 0,
    location: [item.city, item.stateCode || item.state || state].filter(Boolean).join(', '),
    state: (item.stateCode || item.state || state).toUpperCase(),
    endDate: item.saleEndDate || item.endDate || item.closingDate || null,
    url: item.url || item.assetUrl
      || (agencyId && assetId ? `https://www.govdeals.com/asset/${agencyId}/${assetId}` : 'https://www.govdeals.com'),
    source: 'GovDeals',
    category: item.categoryName || item.category || '',
    image: item.imageUrl || item.thumbnail || null,
  };
}

// ── Debug helper ─────────────────────────────────────────────────────────────
async function debugSources(keyword, state = 'MO') {
  const out = {};

  // GSA
  try {
    const resp = await axios.get('https://www.gsaauctions.gov/gsaauctions/aucSrch', {
      params: { sp: 'ns', sf: 'dt', so: 'A', satype: 'S', search: keyword || '' },
      headers: BROWSER_HEADERS,
      timeout: 12000,
    });
    const $ = cheerio.load(resp.data);
    out.gsa = {
      status:    resp.status,
      htmlBytes: resp.data.length,
      title:     $('title').text().trim(),
      tableRows: $('table tr').length,
      links:     $('table a').length,
      sample:    resp.data.slice(500, 900).replace(/\s+/g, ' '),
    };
  } catch (err) {
    out.gsa = { error: err.message, status: err.response?.status };
  }

  // GovDeals
  try {
    const resp = await axios.get('https://www.govdeals.com/index.cfm', {
      params: {
        fa: 'Main.AdvSearchResultsNew', kWord: keyword || '',
        stateCode: state, recsPerPg: '10', timing: 'all',
      },
      headers: BROWSER_HEADERS,
      timeout: 15000,
    });
    const $ = cheerio.load(resp.data);
    out.govdeals = {
      status:      resp.status,
      htmlBytes:   resp.data.length,
      title:       $('title').text().trim(),
      hasNextData: $('#__NEXT_DATA__').length > 0,
      oldRows:     $('tr.even, tr.odd, .searchResultRow').length,
      cardEls:     $('[class*="AssetCard"], [class*="asset-card"], [class*="listing"]').length,
      allLinks:    $('a[href*="asset"], a[href*="index.cfm?fa=Main.Item"]').length,
      sample:      resp.data.slice(500, 900).replace(/\s+/g, ' '),
    };
  } catch (err) {
    out.govdeals = { error: err.message, status: err.response?.status };
  }

  return out;
}

// ── Main export ──────────────────────────────────────────────────────────────
async function findGovAuctions(keyword, states) {
  const validStates = states.filter(s => STL_RADIUS_STATES.includes(s));
  if (!validStates.length) return [];

  const [gsaItems, govDealsItems] = await Promise.all([
    searchGSA(keyword, validStates),
    searchGovDeals(keyword, validStates),
  ]);

  const seen = new Set();
  const all = [];
  for (const item of [...gsaItems, ...govDealsItems]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      all.push(item);
    }
  }

  all.sort((a, b) => {
    const da = a.endDate ? new Date(a.endDate).getTime() : Infinity;
    const db = b.endDate ? new Date(b.endDate).getTime() : Infinity;
    if (da !== db) return da - db;
    return a.currentBid - b.currentBid;
  });

  return all.slice(0, 60);
}

module.exports = { findGovAuctions, debugSources, STL_RADIUS_STATES, STATE_NAMES };
