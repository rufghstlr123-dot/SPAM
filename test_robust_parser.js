// test_robust_parser.js
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  'Referer': 'https://mapleplanet.gg/',
};

async function verifyParser(keyword) {
  const url = `https://mapleplanet.gg/database?q=${encodeURIComponent(keyword)}`;
  console.log(`[TEST] Fetching database search page for "${keyword}"...`);
  try {
    const response = await fetch(url, { headers: HEADERS, timeout: 8000 });
    const html = await response.text();
    const $ = cheerio.load(html);

    const items = [];

    // Robust parsing that matches both:
    // 1) "name":"묘묘","id":"5450000" (Name First)
    // 2) "id":"5450000","name":"묘묘" (ID First)
    $('script').each((_, el) => {
      const content = $(el).html() || '';
      
      // Match Name-First pattern
      const nameFirstRegex = /\\?"name\\?"\s*:\s*\\?"([^"\\]+)\\?"\s*,\s*\\?"id\\?"\s*:\s*\\?"(\d+)\\?"/g;
      let match;
      while ((match = nameFirstRegex.exec(content)) !== null) {
        const name = match[1];
        const id = match[2];
        if (name.toLowerCase().includes(keyword.toLowerCase())) {
          if (!items.find(i => i.id === id)) {
            items.push({ id, name });
          }
        }
      }

      // Match ID-First pattern
      const idFirstRegex = /\\?"id\\?"\s*:\s*\\?"(\d+)\\?"\s*,\s*\\?"name\\?"\s*:\s*\\?"([^"\\]+)\\?"/g;
      while ((match = idFirstRegex.exec(content)) !== null) {
        const id = match[1];
        const name = match[2];
        if (name.toLowerCase().includes(keyword.toLowerCase())) {
          if (!items.find(i => i.id === id)) {
            items.push({ id, name });
          }
        }
      }
    });

    console.log(`[RESULT] Items found for "${keyword}":`, items);
    return items;
  } catch (err) {
    console.error(`[ERROR] Verify failed:`, err.message);
    return null;
  }
}

async function start() {
  await verifyParser('묘묘');
  console.log("----------------------------------------");
  await verifyParser('수레바퀴');
}

start();
