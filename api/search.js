// api/search.js
// Vercel Serverless Function
// Proxies item search requests to the mapleplanet.gg internal API.
// Requires strict header forwarding to bypass Referer/Origin security checks.

const fetch = require('node-fetch');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'Origin': 'https://mapleplanet.gg',
  'Referer': 'https://mapleplanet.gg/',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'Host': 'mapleplanet.gg',
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q } = req.query;
  if (!q || !q.trim()) {
    return res.status(200).json({ status: 'success', data: [] });
  }

  try {
    // Calling the real internal autocomplete api of mapleplanet
    const url = `https://mapleplanet.gg/api/items?q=${encodeURIComponent(q.trim())}`;
    const response = await fetch(url, { 
      method: 'GET',
      headers: HEADERS, 
      timeout: 10000 
    });

    if (!response.ok) {
      throw new Error(`Upstream returned status ${response.status}`);
    }

    const result = await response.json();
    
    // Result payload mapping: { status: 'success', data: [ { id, name }, ... ] }
    return res.status(200).json(result);
  } catch (err) {
    console.error('Search proxy error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
