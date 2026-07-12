// test_clean_get.js
const fetch = require('node-fetch');

// Crucial: We do NOT send the 'Host' header, as node-fetch manages it automatically and setting it manually triggers 400 bad request in many proxies.
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'Origin': 'https://mapleplanet.gg',
  'Referer': 'https://mapleplanet.gg/',
};

async function testCleanGet() {
  const url = `https://mapleplanet.gg/api/items/search?q=${encodeURIComponent('수레바퀴')}`;
  console.log(`[TEST] GET to ${url} without manual Host header...`);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: HEADERS,
      timeout: 5000
    });
    console.log(`-> Status: ${response.status}`);
    const text = await response.text();
    console.log(`-> Response: ${text.substring(0, 500)}`);
  } catch (err) {
    console.log(`-> Error: ${err.message}`);
  }
}

testCleanGet();
