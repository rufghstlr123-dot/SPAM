// test_local_dev.js
const fetch = require('node-fetch');

async function checkLocalDev() {
  const url = 'http://localhost:3009/api/search?q=수레바퀴';
  console.log(`[TEST] Querying local dev server: ${url}`);
  try {
    const res = await fetch(url, { timeout: 4000 });
    console.log("-> Status:", res.status);
    const data = await res.json();
    console.log("-> Data returned:", JSON.stringify(data));
  } catch (err) {
    console.error("-> Local check failed:", err.message);
  }
}

checkLocalDev();
