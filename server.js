require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { findDeals } = require('./services/dealFinder');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/search', async (req, res) => {
  const { q, types } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters.' });
  }

  const dealTypes = types
    ? types.split(',').filter(t => ['bestOffer', 'endingSoon', 'belowAverage', 'misspelled'].includes(t))
    : ['bestOffer', 'endingSoon', 'belowAverage', 'misspelled'];

  if (!dealTypes.length) {
    return res.status(400).json({ error: 'No valid deal types provided.' });
  }

  try {
    const deals = await findDeals(q.trim(), dealTypes);
    res.json({ deals, query: q.trim(), total: deals.length });
  } catch (err) {
    if (err.message.includes('credentials not configured')) {
      return res.status(401).json({
        error: 'eBay API credentials not configured. Copy .env.example to .env and add your keys.',
      });
    }
    console.error('Search error:', err.message);
    res.status(500).json({ error: 'Search failed. Check server logs.' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    ebayConfigured: !!(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET),
  });
});

app.listen(PORT, () => {
  console.log(`\nSchmitty's Deal Finder → http://localhost:${PORT}\n`);
  if (!process.env.EBAY_CLIENT_ID || !process.env.EBAY_CLIENT_SECRET) {
    console.warn('  ⚠  eBay credentials not set. Copy .env.example → .env and add your keys.\n');
  }
});
