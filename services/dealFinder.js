const { searchItems } = require('./ebay');

const STOPWORDS = new Set(['a', 'an', 'the', 'and', 'or', 'for', 'of', 'in', 'on', 'at', 'to', 'with']);

// Generate plausible misspellings of the most significant word in the query.
// Real eBay misspelling snipers exploit typos that eBay's autocorrect misses.
function generateMisspellings(query) {
  const words = query.toLowerCase().trim().split(/\s+/);
  const candidates = words.filter(w => w.length >= 4 && !STOPWORDS.has(w));
  if (!candidates.length) return [];

  const targetWord = candidates.reduce((a, b) => (a.length >= b.length ? a : b));
  const idx = words.indexOf(targetWord);

  const build = newWord => {
    const copy = [...words];
    copy[idx] = newWord;
    return copy.join(' ');
  };

  const results = [];

  // Transpose adjacent chars (positions 1–4)
  for (let i = 1; i < Math.min(targetWord.length - 1, 5); i++) {
    const chars = targetWord.split('');
    [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
    const v = chars.join('');
    if (v !== targetWord) results.push(build(v));
  }

  // Drop first internal vowel
  const vowels = 'aeiou';
  for (let i = 1; i < targetWord.length - 1; i++) {
    if (vowels.includes(targetWord[i])) {
      results.push(build(targetWord.slice(0, i) + targetWord.slice(i + 1)));
      break;
    }
  }

  // Vowel swap: first 'e' → 'a' (or 'a' → 'e')
  if (targetWord.includes('e')) {
    results.push(build(targetWord.replace('e', 'a')));
  } else if (targetWord.includes('a')) {
    results.push(build(targetWord.replace('a', 'e')));
  }

  return [...new Set(results)].slice(0, 3);
}

function formatTime(hours) {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

function scoreItem(item, avgPrice, sources, dealTypes) {
  let score = 0;
  const reasons = [];

  if (
    dealTypes.includes('bestOffer') &&
    (sources.includes('bestOffer') || item.buyingOptions.includes('BEST_OFFER'))
  ) {
    score += 20;
    reasons.push({ type: 'bestOffer', label: 'Accepts Best Offer' });
  }

  if (
    dealTypes.includes('endingSoon') &&
    item.hoursLeft !== null &&
    item.hoursLeft >= 0 &&
    item.hoursLeft <= 24
  ) {
    if (item.bidCount === 0) {
      score += 35;
      reasons.push({ type: 'endingSoon', label: `Ends in ${formatTime(item.hoursLeft)} · 0 bids` });
    } else if (item.bidCount <= 2) {
      score += 20;
      reasons.push({
        type: 'endingSoon',
        label: `Ends in ${formatTime(item.hoursLeft)} · ${item.bidCount} bid${item.bidCount > 1 ? 's' : ''}`,
      });
    }
  }

  if (dealTypes.includes('belowAverage') && avgPrice > 0 && item.price > 0) {
    const pctBelow = (avgPrice - item.price) / avgPrice;
    if (pctBelow >= 0.3) {
      const pct = Math.round(pctBelow * 100);
      score += Math.min(50, pct);
      reasons.push({ type: 'belowAverage', label: `${pct}% below avg ($${avgPrice.toFixed(0)})` });
    }
  }

  if (dealTypes.includes('misspelled') && sources.includes('misspelled')) {
    score += 25;
    reasons.push({ type: 'misspelled', label: 'Misspelled listing' });
  }

  return { score: Math.min(100, score), reasons };
}

async function findDeals(query, dealTypes) {
  const searches = [];

  // Baseline always runs — used for avg price + "below average" detection
  searches.push(
    searchItems(query, { limit: 50 })
      .then(items => ({ items, source: 'baseline' }))
      .catch(err => {
        console.warn('Baseline search failed:', err.message);
        return { items: [], source: 'baseline' };
      })
  );

  if (dealTypes.includes('bestOffer')) {
    searches.push(
      searchItems(query, { filter: 'buyingOptions:{BEST_OFFER}', limit: 50 })
        .then(items => ({ items, source: 'bestOffer' }))
        .catch(err => {
          console.warn('Best Offer search failed:', err.message);
          return { items: [], source: 'bestOffer' };
        })
    );
  }

  if (dealTypes.includes('endingSoon')) {
    searches.push(
      searchItems(query, { filter: 'buyingOptions:{AUCTION}', sort: 'endingSoonest', limit: 50 })
        .then(items => ({ items, source: 'endingSoon' }))
        .catch(err => {
          console.warn('Ending Soon search failed:', err.message);
          return { items: [], source: 'endingSoon' };
        })
    );
  }

  if (dealTypes.includes('misspelled')) {
    for (const misspelled of generateMisspellings(query)) {
      const q = misspelled;
      searches.push(
        searchItems(q, { limit: 20 })
          .then(items => ({ items, source: 'misspelled' }))
          .catch(err => {
            console.warn(`Misspelling search (${q}) failed:`, err.message);
            return { items: [], source: 'misspelled' };
          })
      );
    }
  }

  const results = await Promise.all(searches);

  // Compute average price from baseline
  const baseline = results.find(r => r.source === 'baseline')?.items ?? [];
  const prices = baseline.filter(i => i.price > 0).map(i => i.price);
  const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

  // Merge items across all sources
  const itemMap = new Map();
  for (const { items, source } of results) {
    for (const item of items) {
      if (!itemMap.has(item.id)) itemMap.set(item.id, { item, sources: new Set() });
      itemMap.get(item.id).sources.add(source);
    }
  }

  const deals = [];
  for (const { item, sources } of itemMap.values()) {
    const sourcesArr = [...sources];
    const isSpecialSource = sourcesArr.some(s => s !== 'baseline');
    const pctBelow = avgPrice > 0 && item.price > 0 ? (avgPrice - item.price) / avgPrice : 0;
    const isBelowAvg = dealTypes.includes('belowAverage') && pctBelow >= 0.3;

    if (!isSpecialSource && !isBelowAvg) continue;

    const { score, reasons } = scoreItem(item, avgPrice, sourcesArr, dealTypes);
    if (score > 0 || reasons.length > 0) {
      deals.push({ ...item, score, reasons, avgPrice: Number(avgPrice.toFixed(2)) });
    }
  }

  return deals.sort((a, b) => b.score - a.score).slice(0, 60);
}

module.exports = { findDeals };
