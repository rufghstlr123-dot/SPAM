// test_english_query.js
const fetch = require('node-fetch');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'Origin': 'https://mapleplanet.gg',
  'Referer': 'https://mapleplanet.gg/',
};

async function testEnglish() {
  const query = 'cube';
  const url = `https://mapleplanet.gg/api/items/search?q=${query}`;
  console.log(`[TEST] GET to ${url}`);
  try {
    const response = await fetch(url, { headers: HEADERS, timeout: 5000 });
    console.log(`-> Status: ${response.status}`);
    const text = await response.text();
    console.log(`-> Response: ${text.substring(0, 500)}`);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testEnglish();
