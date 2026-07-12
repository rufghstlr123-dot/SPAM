// scratch/test_search.js
const fetch = require('node-fetch');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'Origin': 'https://mapleplanet.gg',
  'Referer': 'https://mapleplanet.gg/',
};

async function run() {
  try {
    const url = `https://mapleplanet.gg/api/items?q=${encodeURIComponent('수레바퀴')}`;
    console.log("Fetching URL:", url);
    const response = await fetch(url, { 
      method: 'GET',
      headers: HEADERS, 
      timeout: 5000 
    });

    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Response Body preview:", text.substring(0, 500));
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

run();
