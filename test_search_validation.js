// test_search_validation.js
const fetch = require('node-fetch');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'Origin': 'https://mapleplanet.gg',
  'Referer': 'https://mapleplanet.gg/',
};

// We will try different parameter keys for /api/items/search and /api/items/autocomplete
const tests = [
  'https://mapleplanet.gg/api/items/search?query=수레바퀴',
  'https://mapleplanet.gg/api/items/search?q=수레바퀴',
  'https://mapleplanet.gg/api/items/search?keyword=수레바퀴',
  
  'https://mapleplanet.gg/api/items/autocomplete?query=수레바퀴',
  'https://mapleplanet.gg/api/items/autocomplete?q=수레바퀴',
  'https://mapleplanet.gg/api/items/autocomplete?keyword=수레바퀴',
];

async function run() {
  for (const url of tests) {
    console.log(`Testing: ${url}`);
    try {
      const response = await fetch(url, { headers: HEADERS, timeout: 5000 });
      console.log(`-> Status: ${response.status}`);
      const text = await response.text();
      console.log(`-> Response: ${text.substring(0, 300)}`);
      console.log("----------------------------------------");
    } catch (err) {
      console.log(`-> Error: ${err.message}`);
    }
  }
}

run();
