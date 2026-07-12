// app.js — Vercel-compatible version
// All API calls use relative paths (/api/...) instead of http://localhost:8080

// ─────────────────────────────────────────────
//  Global State
// ─────────────────────────────────────────────
let priceData = null; // Populated by /api/prices on load & refresh

let tempCardState = {
  stage: 'search',    // 'search' | 'parameters' | 'display'
  item: null,         // { id, name }
  A: 1000,
  B: 1,
  scrapedData: null,
};

// ─────────────────────────────────────────────
//  Boot
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initRefreshAction();
  loadPricesAndRender();
});

// ─────────────────────────────────────────────
//  Data Loading
// ─────────────────────────────────────────────

/**
 * Fetches /api/prices, stores into priceData, then renders the dashboard.
 */
async function loadPricesAndRender() {
  const timeElement = document.getElementById('last-updated-time');
  try {
    const res = await fetch('/api/prices');
    if (!res.ok) throw new Error(`서버 응답 오류: ${res.status}`);
    const data = await res.json();
    priceData = data;
    renderDashboard();
  } catch (err) {
    console.error('시세 로드 실패:', err);
    if (timeElement) timeElement.textContent = '로드 실패';
    const container = document.getElementById('items-container');
    if (container) renderEmptyState(container);
  }
}

// ─────────────────────────────────────────────
//  Refresh Button
// ─────────────────────────────────────────────
function initRefreshAction() {
  const refreshBtn = document.getElementById('refresh-btn');
  if (!refreshBtn) return;
  const refreshIcon = refreshBtn.querySelector('.refresh-icon');

  refreshBtn.addEventListener('click', async () => {
    refreshBtn.disabled = true;
    if (refreshIcon) refreshIcon.classList.add('spinning');

    try {
      // Re-fetch prices from the API
      const res = await fetch('/api/prices');
      if (!res.ok) throw new Error(`서버 응답 오류: ${res.status}`);
      priceData = await res.json();

      // If Card 4 is displaying an item, refresh it too
      if (tempCardState.stage === 'display' && tempCardState.item) {
        await refreshTempCardPrice();
      }

      renderDashboard();
    } catch (error) {
      console.error('시세 업데이트 실패:', error);
      alert(`시세 업데이트 중 오류가 발생했습니다.\n\n상세 정보: ${error.message}`);
    } finally {
      refreshBtn.disabled = false;
      if (refreshIcon) {
        setTimeout(() => refreshIcon.classList.remove('spinning'), 500);
      }
    }
  });
}

/**
 * Re-fetches Card 4's scraped item price.
 */
async function refreshTempCardPrice() {
  try {
    const res = await fetch(`/api/scrape-item?id=${tempCardState.item.id}`);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') tempCardState.scrapedData = data;
    }
  } catch (err) {
    console.error('임시 카드 갱신 오류:', err);
  }
}

// ─────────────────────────────────────────────
//  Dashboard Render
// ─────────────────────────────────────────────
function renderDashboard() {
  const container = document.getElementById('items-container');
  const timeElement = document.getElementById('last-updated-time');
  if (!container) return;

  if (!priceData || !priceData.items) {
    if (timeElement) timeElement.textContent = '데이터 없음';
    renderEmptyState(container);
    return;
  }

  if (timeElement) timeElement.textContent = priceData.lastUpdated || 'N/A';
  container.innerHTML = '';

  // 1. Fixed 3 cards
  priceData.items.slice(0, 3).forEach(item => {
    const isError = item.status === 'Failed' || item.price === 'Error' || item.price === 'N/A';
    const cardClass = isError ? 'price-card failed' : 'price-card';

    let spamRatioText = 'N/A';
    if (!isError) {
      const priceNum = parseFloat(item.price.replace(/,/g, ''));
      if (!isNaN(priceNum) && priceNum > 0) {
        const paramA = typeof item.A !== 'undefined' ? item.A : 4500;
        const paramB = typeof item.B !== 'undefined' ? item.B : 11;
        const ratio = paramA / (priceNum * paramB * 0.9 * 0.000001);
        spamRatioText = Math.round(ratio).toLocaleString('ko-KR') + ' : 1';
      }
    }

    container.innerHTML += `
      <article class="${cardClass}">
        <div class="card-header-block">
          <div class="icon-container">
            <img src="${item.icon}" alt="${item.name}" class="item-icon" onerror="this.src='https://cdn.mapleplanet.gg/icons/item/5062000.webp'">
          </div>
          <div class="item-title-block">
            <span class="item-id">ID ${item.id}</span>
            <h2 class="item-name">${item.name}</h2>
          </div>
        </div>
        <div class="trade-price-block">
          <div class="price-section">
            <span class="price-label">최근 체결가</span>
            <div class="price-value-container">
              <span class="price-value">${isError ? 'N/A' : item.price}</span>
              ${isError ? '' : '<span class="currency">메소</span>'}
            </div>
          </div>
          <div class="spam-ratio-section">
            <span class="spam-label">스팸 비율</span>
            <span class="spam-value">${spamRatioText}</span>
          </div>
        </div>
        <div class="card-action-block">
          <a href="${item.url}" target="_blank" rel="noopener" class="btn-link">
            시세 정보 상세보기
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
            </svg>
          </a>
        </div>
      </article>
    `;
  });

  // 2. Card 4 — temporary search card
  const card4El = document.createElement('article');
  card4El.className = 'price-card';
  card4El.id = 'temp-search-card';
  container.appendChild(card4El);
  renderTempCardContent(card4El);
}

// ─────────────────────────────────────────────
//  Card 4 — State Machine
// ─────────────────────────────────────────────
function renderTempCardContent(cardEl) {
  if (tempCardState.stage === 'search') {
    cardEl.innerHTML = `
      <div class="card-header-block" style="width: 100%;">
        <div class="icon-container">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" style="color: var(--color-primary); filter: drop-shadow(0 0 8px var(--color-primary-glow));">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <div class="item-title-block" style="flex: 1; position: relative;">
          <div class="card-search-wrapper">
            <input type="text" id="card-search-input" placeholder="아이템 이름" autocomplete="off">
            <div id="card-search-dropdown" class="card-search-dropdown hidden"></div>
          </div>
        </div>
      </div>
      <!-- Empty body template with generic spacer -->
      <div style="flex: 1; display: flex; align-items: center; justify-content: center; min-height: 120px; border: 1px dashed rgba(255,255,255,0.04); border-radius: 16px; margin-top: 1rem; background: rgba(0,0,0,0.08);">
        <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">아이템을 검색하여 등록해 주세요.</span>
      </div>
    `;
    initCardSearchInput();

  } else if (tempCardState.stage === 'parameters') {
    const iconUrl = `https://cdn.mapleplanet.gg/icons/item/${tempCardState.item.id}.webp`;
    cardEl.innerHTML = `
      <button class="btn-delete" id="temp-reset-btn" title="검색창으로 돌아가기">&times;</button>
      <div class="card-parameter-form">
        <div class="card-selected-item-info">
          <img src="${iconUrl}" alt="" class="card-selected-icon" onerror="this.src='https://cdn.mapleplanet.gg/icons/item/5062000.webp'">
          <span class="card-selected-name">${tempCardState.item.name}</span>
          <span class="card-selected-id">ID: ${tempCardState.item.id}</span>
        </div>
        <form id="temp-parameter-form">
          <div class="card-form-grid">
            <div class="card-form-group">
              <label for="temp-param-a">메이플 포인트</label>
              <input type="number" id="temp-param-a" required value="${tempCardState.A}" min="1" step="any">
            </div>
            <div class="card-form-group">
              <label for="temp-param-b">수량</label>
              <input type="number" id="temp-param-b" required value="${tempCardState.B}" min="1" step="any">
            </div>
          </div>
          <button type="submit" class="btn-card-submit" id="temp-submit-btn">시세 조회 및 추가</button>
        </form>
      </div>
    `;

    document.getElementById('temp-reset-btn').addEventListener('click', () => {
      tempCardState.stage = 'search';
      renderTempCardContent(cardEl);
    });

    document.getElementById('temp-parameter-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      tempCardState.A = parseFloat(document.getElementById('temp-param-a').value);
      tempCardState.B = parseFloat(document.getElementById('temp-param-b').value);

      const submitBtn = document.getElementById('temp-submit-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = '수집하는 중...';

      try {
        const res = await fetch(`/api/scrape-item?id=${tempCardState.item.id}`);
        if (!res.ok) throw new Error('시세 수집 실패');
        const data = await res.json();
        if (data.status === 'success') {
          tempCardState.scrapedData = data;
          tempCardState.stage = 'display';
          renderDashboard();
        } else {
          throw new Error(data.message || '알 수 없는 오류');
        }
      } catch (err) {
        console.error(err);
        alert('시세를 가져오지 못했습니다. 올바른 아이템 ID인지 확인해 주세요.');
        submitBtn.disabled = false;
        submitBtn.textContent = '시세 조회 및 추가';
      }
    });

  } else if (tempCardState.stage === 'display') {
    const item = tempCardState.scrapedData;
    const isError = !item || item.price === 'Error' || item.price === 'N/A';
    cardEl.className = isError ? 'price-card failed' : 'price-card';

    let spamRatioText = 'N/A';
    if (!isError) {
      const priceNum = parseFloat(item.price.replace(/,/g, ''));
      if (!isNaN(priceNum) && priceNum > 0) {
        const ratio = tempCardState.A / (priceNum * tempCardState.B * 0.9 * 0.000001);
        spamRatioText = Math.round(ratio).toLocaleString('ko-KR') + ' : 1';
      }
    }

    cardEl.innerHTML = `
      <button class="btn-delete" id="temp-clear-btn" title="검색창으로 재설정">&times;</button>
      <div class="card-header-block">
        <div class="icon-container">
          <img src="${item.icon}" alt="${item.name}" class="item-icon" onerror="this.src='https://cdn.mapleplanet.gg/icons/item/5062000.webp'">
        </div>
        <div class="item-title-block">
          <span class="item-id">ID ${item.id}</span>
          <h2 class="item-name">${item.name}</h2>
        </div>
      </div>
      <div class="trade-price-block">
        <div class="price-section">
          <span class="price-label">최근 체결가</span>
          <div class="price-value-container">
            <span class="price-value">${isError ? 'N/A' : item.price}</span>
            ${isError ? '' : '<span class="currency">메소</span>'}
          </div>
        </div>
        <div class="spam-ratio-section">
          <span class="spam-label">스팸 비율</span>
          <span class="spam-value">${spamRatioText}</span>
        </div>
      </div>
      <div class="card-action-block">
        <a href="${item.url}" target="_blank" rel="noopener" class="btn-link">
          시세 정보 상세보기
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
          </svg>
        </a>
      </div>
    `;

    document.getElementById('temp-clear-btn').addEventListener('click', () => {
      tempCardState = { stage: 'search', item: null, A: 1000, B: 1, scrapedData: null };
      renderDashboard();
    });
  }
}

// ─────────────────────────────────────────────
//  Card 4 — Autocomplete Search
// ─────────────────────────────────────────────
function initCardSearchInput() {
  const searchInput = document.getElementById('card-search-input');
  const searchDropdown = document.getElementById('card-search-dropdown');
  if (!searchInput || !searchDropdown) return;

  let debounceTimeout = null;

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    const query = searchInput.value.trim();
    if (!query) {
      searchDropdown.innerHTML = '';
      searchDropdown.classList.add('hidden');
      return;
    }

    // Immediately unhide and show loading state
    searchDropdown.classList.remove('hidden');
    searchDropdown.innerHTML = `
      <div style="font-size:0.75rem; padding:10px; text-align:center; color:var(--text-muted);">
        검색 중...
      </div>
    `;

    debounceTimeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('검색 에러');
        const result = await res.json();
        renderCardSearchDropdown(result.data || [], searchDropdown);
      } catch (err) {
        console.error('카드 검색 오류:', err);
        searchDropdown.innerHTML = `
          <div style="font-size:0.75rem; padding:10px; text-align:center; color:var(--text-muted);">
            검색 오류가 발생했습니다.
          </div>
        `;
      }
    }, 400);
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      searchDropdown.classList.add('hidden');
    }
  });
}

function renderCardSearchDropdown(items, dropdownEl) {
  dropdownEl.innerHTML = '';
  const query = document.getElementById('card-search-input').value.trim();

  // 1. If matches exist, render them
  if (items.length > 0) {
    items.slice(0, 5).forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'card-search-item';
      const iconUrl = `https://cdn.mapleplanet.gg/icons/item/${item.id}.webp`;
      itemEl.innerHTML = `
        <div class="card-search-item-icon-container">
          <img src="${iconUrl}" alt="" class="card-search-item-icon" onerror="this.src='https://cdn.mapleplanet.gg/icons/item/5062000.webp'">
        </div>
        <div class="card-search-item-text">
          <span class="card-search-item-id">ID ${item.id}</span>
          <span class="card-search-item-name">${item.name}</span>
        </div>
      `;
      itemEl.addEventListener('click', () => {
        tempCardState.item = item;
        tempCardState.stage = 'parameters';
        if (item.id == 5062000)      { tempCardState.A = 4500; tempCardState.B = 11; }
        else if (item.id == 5520000) { tempCardState.A = 2500; tempCardState.B = 1; }
        else if (item.id == 5041000) { tempCardState.A = 250;  tempCardState.B = 1; }
        else                         { tempCardState.A = 1000; tempCardState.B = 1; }
        const cardEl = document.getElementById('temp-search-card');
        if (cardEl) renderTempCardContent(cardEl);
      });
      dropdownEl.appendChild(itemEl);
    });
  }

  // 2. Always append a helpful direct ID entry option at the bottom / empty state
  const helperEl = document.createElement('div');
  helperEl.style.borderTop = '1px solid rgba(255,255,255,0.06)';
  helperEl.style.padding = '10px';
  helperEl.style.display = 'flex';
  helperEl.style.flexDirection = 'column';
  helperEl.style.gap = '6px';
  helperEl.style.alignItems = 'center';

  if (items.length === 0) {
    helperEl.innerHTML = `
      <span style="font-size:0.75rem; color:var(--text-muted);">찾으시는 아이템 "${query}"이(가) 목록에 없나요?</span>
      <button id="direct-id-entry-btn" style="width:100%; padding:8px; border:none; background:var(--color-primary); color:white; border-radius:8px; font-size:0.75rem; font-weight:600; cursor:pointer;">
        "${query}" 아이템 ID로 추가하기
      </button>
      <a href="https://mapleplanet.gg/database" target="_blank" style="font-size:0.65rem; color:var(--color-primary); text-decoration:underline;">
        메이플 플래닛 도감에서 ID 찾기 ↗
      </a>
    `;
  } else {
    helperEl.innerHTML = `
      <a href="https://mapleplanet.gg/database" target="_blank" style="font-size:0.65rem; color:var(--text-muted); text-decoration:none; opacity:0.8;">
        원하는 아이템이 없나요? 도감에서 ID로 추가하기 ↗
      </a>
    `;
    helperEl.style.cursor = 'pointer';
    helperEl.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') return;
      const rawId = prompt("등록할 아이템의 ID 숫자를 입력해 주세요.\n(예: 수레바퀴는 4031024)");
      if (rawId && /^\d+$/.test(rawId)) {
        tempCardState.item = { id: rawId, name: `아이템 ${rawId}` };
        tempCardState.stage = 'parameters';
        tempCardState.A = 1000;
        tempCardState.B = 1;
        const cardEl = document.getElementById('temp-search-card');
        if (cardEl) renderTempCardContent(cardEl);
      }
    });
  }

  dropdownEl.appendChild(helperEl);
  dropdownEl.classList.remove('hidden');

  const directBtn = document.getElementById('direct-id-entry-btn');
  if (directBtn) {
    directBtn.addEventListener('click', () => {
      const rawId = prompt(`"${query}" 아이템의 메이플 플래닛 ID 숫자를 입력해 주세요.\n(도감 페이지 주소의 숫자값)`);
      if (rawId && /^\d+$/.test(rawId)) {
        tempCardState.item = { id: rawId, name: query || `아이템 ${rawId}` };
        tempCardState.stage = 'parameters';
        tempCardState.A = 1000;
        tempCardState.B = 1;
        const cardEl = document.getElementById('temp-search-card');
        if (cardEl) renderTempCardContent(cardEl);
      } else if (rawId) {
        alert("숫자 ID만 입력 가능합니다.");
      }
    });
  }
}

// ─────────────────────────────────────────────
//  Empty State
// ─────────────────────────────────────────────
function renderEmptyState(container) {
  container.innerHTML = `
    <div class="price-card failed" style="grid-column: 1 / -1; align-items: center; text-align: center; padding: 3rem;">
      <div class="icon-container" style="border-color: #EF4444; box-shadow: 0 0 15px rgba(239,68,68,0.2);">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#EF4444" viewBox="0 0 16 16">
          <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm-1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/>
          <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
        </svg>
      </div>
      <h2 style="margin-top: 1rem; color: #EF4444;">시세 데이터를 로드할 수 없습니다.</h2>
      <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.5rem; max-width: 500px;">
        서버에서 데이터를 가져오지 못했습니다.<br>
        새로고침 버튼을 눌러 다시 시도해 주세요!
      </p>
    </div>
  `;
}
