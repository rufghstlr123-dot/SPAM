// test_final_parser.js
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
  console.log(`[TEST] Fetching: ${url}`);
  try {
    const response = await fetch(url, { headers: HEADERS, timeout: 8000 });
    console.log(`[TEST] Database page status: ${response.status}`);
    const html = await response.text();
    const $ = cheerio.load(html);

    const items = [];

    // Parse Next.js __NEXT_DATA__ block or self.__next_f stream pushes
    $('script').each((_, el) => {
      const content = $(el).html() || '';
      // We will look for item data sequences inside Next.js streaming serialization
      // Next.js chunks store values like: "id":"1003112","name":"카오스 자쿰의 투구" 
      // or escaped variants: \"id\":\"1003112\",\"name\":\"카오스 자쿰의 투구\"
      const regex = /\\?"id\\?"\s*:\s*\\?"(\d+)\\?"\s*,\s*\\?"name\\?"\s*:\s*\\?"([^"\\]+)\\?"/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const id = match[1];
        const name = match[2];
        // Ensure name contains the searched keyword to prevent unrelated matches from scripts
        if (name.toLowerCase().includes(keyword.toLowerCase())) {
          if (!items.find(i => i.id === id)) {
            items.push({ id, name });
          }
        }
      }
    });

    console.log(`[RESULT] Items parsed for "${keyword}":`, items);
    return items;
  } catch (err) {
    console.error(`[ERROR] Parsing failed:`, err.message);
    return null;
  }
}

async function start() {
  await verifyParser('수레바퀴');
  console.log("----------------------------------------");
  await verifyParser('아바타');
  console.log("----------------------------------------");
  await verifyParser('혼돈의 주문서');
}

start();
