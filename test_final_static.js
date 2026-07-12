// test_final_static.js
const fetch = require('node-fetch');

async function testStatic() {
  const url = 'http://localhost:3012/api/prices';
  console.log(`[TEST] Verifying final static prices API: ${url}`);
  try {
    const res = await fetch(url, { timeout: 15000 });
    console.log("-> Status Code:", res.status);
    const json = await res.json();
    console.log("-> Success Status:", json.status);
    console.log("-> Total Items scraped:", json.items?.length);
    if (json.items) {
      json.items.forEach((item, idx) => {
        console.log(`   Item [${idx + 1}]: ID=${item.id}, Name=${item.name}, Price=${item.price}, Status=${item.status}`);
      });
    }
  } catch (err) {
    console.error("-> Static check failed:", err.message);
  }
}

testStatic();
