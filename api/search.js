// api/search.js
// Vercel Serverless Function
// Searches items by scraping the mapleplanet.gg database page and parsing
// the embedded Next.js __NEXT_DATA__ JSON payload.

const fetch = require('node-fetch');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  'Referer': 'https://mapleplanet.gg/',
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q } = req.query;
  if (!q || !q.trim()) {
    return res.status(400).json({ status: 'error', message: "Missing query parameter 'q'" });
  }

  // Strategy: fetch the database page with a query and parse item links from HTML.
  // mapleplanet.gg renders items in <a href="/items/{id}-{slug}"> links in SSR HTML.
  const url = `https://mapleplanet.gg/database?q=${encodeURIComponent(q.trim())}`;

  try {
    const response = await fetch(url, { headers: HEADERS, timeout: 12000 });
    const html = await response.text();
    const $ = cheerio.load(html);

    const items = [];

    // Parse item links: /items/{id}-{slug} or /items/{id}
    $('a[href*="/items/"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const match = href.match(/\/items\/(\d+)/);
      if (!match) return;

      const id = match[1];
      // Avoid duplicates
      if (items.find(i => i.id === id)) return;

      // Try to get item name from the link text or alt attribute of child img
      let name = $(el).text().trim()
        || $(el).find('img').attr('alt')?.trim()
        || `아이템 ${id}`;

      // Clean up whitespace / newlines
      name = name.replace(/\s+/g, ' ').trim();
      if (!name || name.length < 1) name = `아이템 ${id}`;

      items.push({ id, name });
      if (items.length >= 8) return false; // limit results
    });

    return res.status(200).json({
      status: 'success',
      data: items,
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
