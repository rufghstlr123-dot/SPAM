// api/search.js
// Vercel Serverless Function
// Proxies item search requests to the mapleplanet.gg public API.

const fetch = require('node-fetch');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  'Referer': 'https://mapleplanet.gg/',
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q } = req.query;
  if (!q) return res.status(400).json({ status: 'error', message: "Missing query parameter 'q'" });

  try {
    const url = `https://mapleplanet.gg/api/items?q=${encodeURIComponent(q)}`;
    const response = await fetch(url, { headers: HEADERS, timeout: 10000 });
    if (!response.ok) throw new Error(`upstream ${response.status}`);

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
