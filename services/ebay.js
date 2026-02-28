const axios = require('axios');

const BROWSE_API = 'https://api.ebay.com/buy/browse/v1/item_summary/search';
const TOKEN_URL = 'https://api.ebay.com/identity/v1/oauth2/token';
const SCOPE = 'https://api.ebay.com/oauth/api_scope';

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const { EBAY_CLIENT_ID, EBAY_CLIENT_SECRET } = process.env;
  if (!EBAY_CLIENT_ID || !EBAY_CLIENT_SECRET) {
    throw new Error('eBay API credentials not configured');
  }

  const credentials = Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString('base64');
  const res = await axios.post(
    TOKEN_URL,
    `grant_type=client_credentials&scope=${encodeURIComponent(SCOPE)}`,
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  cachedToken = res.data.access_token;
  tokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000;
  return cachedToken;
}

async function searchItems(query, { filter, sort, limit = 50 } = {}) {
  const token = await getAccessToken();

  let url = `${BROWSE_API}?q=${encodeURIComponent(query)}&limit=${limit}`;
  if (filter) url += `&filter=${encodeURIComponent(filter)}`;
  if (sort) url += `&sort=${encodeURIComponent(sort)}`;

  const res = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
    },
  });

  return (res.data.itemSummaries || []).map(normalizeItem);
}

function normalizeItem(item) {
  const price = item.price ? parseFloat(item.price.value) : 0;
  const endDate = item.itemEndDate ? new Date(item.itemEndDate) : null;
  const hoursLeft = endDate ? (endDate - Date.now()) / 3_600_000 : null;

  return {
    id: item.itemId,
    title: item.title,
    price,
    currency: item.price?.currency || 'USD',
    image: item.image?.imageUrl || null,
    condition: item.condition || null,
    url: item.itemWebUrl,
    buyingOptions: item.buyingOptions || [],
    bidCount: item.bidCount ?? 0,
    endDate,
    hoursLeft,
    seller: {
      name: item.seller?.username || 'Unknown',
      feedback: item.seller?.feedbackScore || 0,
      feedbackPct: item.seller?.feedbackPercentage || '0',
    },
  };
}

module.exports = { searchItems };
