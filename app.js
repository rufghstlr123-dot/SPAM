// app.js — Vercel-compatible version
// All API calls use relative paths (/api/...) instead of http://localhost:8080

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
let priceData = null;

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

  // Render all 4 fixed items returned from the backend prices API
  priceData.items.forEach(item => {
    const isError = item.status === 'Failed' || item.price === 'Error' || item.price === 'N/A';
    const cardClass = isError ? 'price-card failed' : 'price-card';

    let spamRatioText = 'N/A';
    if (!isError) {
      const priceNum = parseFloat(item.price.replace(/,/g, ''));
      if (!isNaN(priceNum) && priceNum > 0) {
        const paramA = typeof item.A !== 'undefined' ? item.A : 1000;
        const paramB = typeof item.B !== 'undefined' ? item.B : 1;
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
