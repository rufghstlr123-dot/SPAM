// test_gms_search.js
const fetch = require('node-fetch');

async function test() {
  const url = `https://maplestory.io/api/GMS/253/item/search?q=wheel`;
  try {
    const response = await fetch(url, { timeout: 8000 });
    const text = await response.text();
    console.log("Raw response:", text.substring(0, 1000));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
