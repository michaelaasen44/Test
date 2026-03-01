require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { findGovAuctions, STL_RADIUS_STATES } = require('./services/govAuctions');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/gov-auctions', async (req, res) => {
  const { q = '', states } = req.query;

  const selectedStates = states
    ? states.split(',').map(s => s.trim().toUpperCase()).filter(s => STL_RADIUS_STATES.includes(s))
    : [...STL_RADIUS_STATES];

  if (!selectedStates.length) {
    return res.status(400).json({ error: 'No valid states provided.' });
  }

  try {
    const auctions = await findGovAuctions(q.trim(), selectedStates);
    res.json({ auctions, total: auctions.length, query: q.trim(), states: selectedStates });
  } catch (err) {
    console.error('Gov auctions error:', err.message);
    res.status(500).json({ error: 'Gov auction search failed. Check server logs.' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`\nSchmitty's Gov Auction Finder → http://localhost:${PORT}\n`);
});
