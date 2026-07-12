// test_html_links.js
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  'Referer': 'https://mapleplanet.gg/',
};

async function checkLinks(keyword) {
  const url = `https://mapleplanet.gg/database?q=${encodeURIComponent(keyword)}`;
  console.log(`[TEST] Checking HTML links for "${keyword}" at: ${url}`);
  try {
    const response = await fetch(url, { headers: HEADERS, timeout: 8000 });
    const html = await response.text();
    const $ = cheerio.load(html);

    const items = [];

    // Find all links containing /items/ or /database/
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      const imgAlt = $(el).find('img').attr('alt')?.trim();

      if (href.includes('/items/') || href.includes('/mobs/') || href.includes('/maps/')) {
        console.log(`Found raw link: href="${href}", text="${text}", imgAlt="${imgAlt}"`);
        const idMatch = href.match(/\/items\/(\d+)/);
        if (idMatch) {
          const id = idMatch[1];
          const name = text || imgAlt || `아이템 ${id}`;
          if (!items.find(i => i.id === id)) {
            items.push({ id, name });
          }
        }
      }
    });

    console.log(`Parsed items:`, items);
  } catch (err) {
    console.error(err.message);
  }
}

checkLinks('묘묘');
