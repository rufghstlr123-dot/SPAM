// api/scrape-item.js
// Vercel Serverless Function
// Scrapes a single item page from mapleplanet.gg by item ID.

const fetch = require('node-fetch');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9',
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ status: 'error', message: "Missing query parameter 'id'" });

  const url = `https://mapleplanet.gg/items/${id}`;

  try {
    const response = await fetch(url, { headers: HEADERS, timeout: 12000 });
    const html = await response.text();
    const $ = cheerio.load(html);

    let price = 'N/A';
    let volume = 'N/A';
    let onSale = 'N/A';
    let lowest = 'N/A';
    let nameFromPage = 'Unknown Item';

    // Parse name
    const h1 = $('h1').first().text().trim();
    if (h1) nameFromPage = h1;

    // Walk div pairs: label → sibling value
    $('div').each((_, el) => {
      const text = $(el).text().trim();
      const nextText = $(el).next('div').text().trim();

      if (text === '최근 체결가' && nextText) price = nextText.replace(/[^0-9,]/g, '').trim() || nextText;
      if (text === '24h 거래량' && nextText) volume = nextText.replace(/건.*/, '').trim() + '건';
      if (text === '판매중' && nextText) onSale = nextText.replace(/건.*/, '').trim() + '건';
    });

    $('span').each((_, el) => {
      const prev = $(el).prev().text().trim();
      if (prev === '최저') lowest = $(el).text().trim();
    });

    return res.status(200).json({
      status: 'success',
      id,
      name: nameFromPage,
      price,
      volume,
      onSale,
      lowest,
      icon: `https://cdn.mapleplanet.gg/icons/item/${id}.webp`,
      url,
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
