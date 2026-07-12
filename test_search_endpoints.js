// test_search_endpoints.js
const fetch = require('node-fetch');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'Origin': 'https://mapleplanet.gg',
  'Referer': 'https://mapleplanet.gg/',
};

const candidateUrls = [
  'https://mapleplanet.gg/api/search?q=',
  'https://mapleplanet.gg/api/database?q=',
  'https://mapleplanet.gg/api/items/search?q=',
  'https://mapleplanet.gg/api/item/search?q=',
  'https://mapleplanet.gg/api/search/items?q=',
  'https://mapleplanet.gg/api/items/autocomplete?q=',
];

async function testAll() {
  const query = encodeURIComponent('수레바퀴');
  for (const baseUrl of candidateUrls) {
    const fullUrl = baseUrl + query;
    console.log(`Testing: ${fullUrl}`);
    try {
      const response = await fetch(fullUrl, { headers: HEADERS, timeout: 5000 });
      console.log(`-> Status: ${response.status}`);
      const text = await response.text();
      console.log(`-> Response (first 120 chars): ${text.substring(0, 120)}`);
      console.log("----------------------------------------");
    } catch (err) {
      console.log(`-> Error: ${err.message}`);
    }
  }
}

testAll();
