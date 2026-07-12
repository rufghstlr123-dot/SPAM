// test_search_post.js
const fetch = require('node-fetch');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'Content-Type': 'application/json',
  'Origin': 'https://mapleplanet.gg',
  'Referer': 'https://mapleplanet.gg/',
};

async function testPost() {
  const url = 'https://mapleplanet.gg/api/items/search';
  const bodies = [
    { q: '수레바퀴' },
    { query: '수레바퀴' },
    { keyword: '수레바퀴' },
    { searchTerm: '수레바퀴' }
  ];

  for (const body of bodies) {
    console.log(`[TEST] POST to ${url} with body:`, JSON.stringify(body));
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(body),
        timeout: 5000
      });
      console.log(`-> Status: ${response.status}`);
      const text = await response.text();
      console.log(`-> Response: ${text.substring(0, 300)}`);
      console.log("----------------------------------------");
    } catch (err) {
      console.log(`-> Error: ${err.message}`);
    }
  }
}

testPost();
