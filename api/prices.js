// api/prices.js
// Vercel Serverless Function
// Scrapes the 3 fixed items from mapleplanet.gg and returns their prices as JSON.

const fetch = require('node-fetch');
const cheerio = require('cheerio');

const FIXED_ITEMS = [
  { id: '5062000', name: '미라클 큐브',         A: 4500, B: 11 },
  { id: '5520000', name: '카르마의 가위',        A: 2500, B: 1  },
  { id: '5041000', name: '고성능 순간이동의 돌', A: 250,  B: 1  },
  { id: '5450000', name: '보따리상인 묘묘',      A: 2500, B: 1  },
];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9',
};

async function scrapeItem(item) {
  const url = `https://mapleplanet.gg/items/${item.id}`;
  try {
    const res = await fetch(url, { headers: HEADERS, timeout: 12000 });
    const html = await res.text();
    const $ = cheerio.load(html);

    let price = 'N/A';
    let volume = 'N/A';
    let onSale = 'N/A';
    let lowest = 'N/A';
    let nameFromPage = item.name;

    // Parse name from h1
    const h1 = $('h1').first().text().trim();
    if (h1) nameFromPage = h1;

    // Walk all div pairs: label div followed by value div
    $('div').each((_, el) => {
      const text = $(el).text().trim();
      const nextText = $(el).next('div').text().trim();

      if (text === '최근 체결가' && nextText) price = nextText.replace(/[^0-9,]/g, '').trim() || nextText;
      if (text === '24h 거래량' && nextText) volume = nextText.replace(/건.*/, '').trim() + '건';
      if (text === '판매중' && nextText) onSale = nextText.replace(/건.*/, '').trim() + '건';
    });

    // Lowest price from span
    $('span').each((_, el) => {
      const prev = $(el).prev().text().trim();
      if (prev === '최저') lowest = $(el).text().trim();
    });

    return {
      id: item.id,
      name: nameFromPage,
      price,
      volume,
      onSale,
      lowest,
      A: item.A,
      B: item.B,
      icon: `https://cdn.mapleplanet.gg/icons/item/${item.id}.webp`,
      url,
      status: price !== 'N/A' ? 'Success' : 'Failed',
    };
  } catch (err) {
    return {
      id: item.id,
      name: item.name,
      price: 'Error',
      volume: 'Error',
      onSale: 'Error',
      lowest: 'Error',
      A: item.A,
      B: item.B,
      icon: `https://cdn.mapleplanet.gg/icons/item/${item.id}.webp`,
      url: `https://mapleplanet.gg/items/${item.id}`,
      status: 'Failed',
    };
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const results = await Promise.all(FIXED_ITEMS.map(scrapeItem));
    const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    return res.status(200).json({
      status: 'success',
      lastUpdated: now,
      items: results,
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
