// dump_scripts.js
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  'Referer': 'https://mapleplanet.gg/',
};

async function dump() {
  const url = `https://mapleplanet.gg/database?q=${encodeURIComponent('수레바퀴')}`;
  try {
    const response = await fetch(url, { headers: HEADERS, timeout: 8000 });
    const html = await response.text();
    const $ = cheerio.load(html);

    console.log("Analyzing script tags...");
    $('script').each((i, el) => {
      const content = $(el).html() || '';
      if (content.includes('__next_f') || content.includes('__NEXT_DATA__')) {
        console.log(`Script [${i}] length:`, content.length);
        // Look for occurrences of '4031024' (ID for 운명의 수레바퀴) or '수레바퀴'
        const indexId = content.indexOf('4031024');
        const indexName = content.indexOf('수레바퀴');
        console.log(`-> '4031024' index:`, indexId);
        console.log(`-> '수레바퀴' index:`, indexName);

        if (indexId !== -1) {
          console.log("Context around ID:", content.substring(Math.max(0, indexId - 150), Math.min(content.length, indexId + 150)));
        }
        if (indexName !== -1 && indexId === -1) {
          console.log("Context around Name:", content.substring(Math.max(0, indexName - 150), Math.min(content.length, indexName + 150)));
        }
      }
    });
  } catch (err) {
    console.error(err);
  }
}

dump();
