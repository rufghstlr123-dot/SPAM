// api/search.js
// Vercel Serverless Function
// Hybrid item search: utilizes a local static item list for instant lookup
// and falls back to dynamic scraping from mapleplanet.gg/database?q= if not found.

const fetch = require('node-fetch');
const cheerio = require('cheerio');

// Pre-defined high-frequency trade items on mapleplanet
const POPULAR_ITEMS = [
  { id: '5062000', name: '미라클 큐브' },
  { id: '5520000', name: '카르마의 가위' },
  { id: '5041000', name: '고성능 순간이동의 돌' },
  { id: '2049100', name: '혼돈의 주문서 60%' },
  { id: '1003112', name: '카오스 자쿰의 투구' },
  { id: '1122076', name: '카오스 혼테일의 목걸이' },
  { id: '2070006', name: '일비 표창' },
  { id: '2070007', name: '뇌전 수리검' },
  { id: '2049000', name: '백의 주문서 1%' },
  { id: '5450000', name: '보따리상인 묘묘' },
  { id: '5062001', name: '마스터 미라클 큐브' },
  { id: '2049116', name: '긍정의 혼돈의 주문서 50%' },
  { id: '2049122', name: '놀라운 긍정의 혼돈의 주문서 60%' },
  { id: '2340000', name: '프로텍트 쉴드' },
  { id: '5064000', name: '세이프티 쉴드' },
  { id: '5064300', name: '리커버리 쉴드' },
  { id: '5068300', name: '쁘띠 아르바이트 펫 복제' },
  { id: '4001168', name: '저주받은 인형' }
];

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

  const queryClean = q.trim().toLowerCase();

  // 1. Check popular static list first (instant match)
  const matches = POPULAR_ITEMS.filter(item => 
    item.name.toLowerCase().includes(queryClean) || item.id.includes(queryClean)
  );

  if (matches.length > 0) {
    return res.status(200).json({
      status: 'success',
      data: matches,
    });
  }

  // 2. Fallback: Dynamic scraping by parsing JSON text inside script tags on the search page
  const url = `https://mapleplanet.gg/database?q=${encodeURIComponent(q.trim())}`;
  try {
    const response = await fetch(url, { headers: HEADERS, timeout: 10000 });
    const html = await response.text();
    const $ = cheerio.load(html);

    const items = [];

    // Next.js page state search
    $('script').each((_, el) => {
      const content = $(el).html() || '';
      if (content.includes('self.__next_f') || content.includes('__NEXT_DATA__')) {
        // Match IDs and Names via regular expressions inside the serialised JS scripts
        const idRegex = /"id"\s*:\s*"(\d+)"\s*,\s*"name"\s*:\s*"([^"]+)"/g;
        let match;
        while ((match = idRegex.exec(content)) !== null) {
          const id = match[1];
          const name = match[2];
          if (!items.find(i => i.id === id) && name.toLowerCase().includes(queryClean)) {
            items.push({ id, name });
          }
          if (items.length >= 8) break;
        }
      }
    });

    // Sub-fallback: Parse plain item links in raw markup if regex search did not capture any
    if (items.length === 0) {
      $('a[href*="/items/"]').each((_, el) => {
        const href = $(el).attr('href') || '';
        const match = href.match(/\/items\/(\d+)/);
        if (!match) return;

        const id = match[1];
        if (items.find(i => i.id === id)) return;

        let name = $(el).text().trim() || $(el).find('img').attr('alt')?.trim() || `아이템 ${id}`;
        name = name.replace(/\s+/g, ' ').trim();
        if (name && name.toLowerCase().includes(queryClean)) {
          items.push({ id, name });
        }
        if (items.length >= 5) return false;
      });
    }

    return res.status(200).json({
      status: 'success',
      data: items,
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
