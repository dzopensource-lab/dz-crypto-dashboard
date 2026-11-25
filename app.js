const API_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=4&page=1&sparkline=false&price_change_percentage=24h';
let chartInstance = null;

function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = 
    String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
}
setInterval(updateClock, 1000);
updateClock();

async function fetchCryptoData() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Erreur API');
  return await res.json();
}

function renderCards(data) {
  const container = document.getElementById('cards');
  container.innerHTML = data.map(coin => {
    const change = coin.price_change_percentage_24h || 0;
    const changeClass = change >= 0 ? 'up' : 'down';
    const changeIcon = change >= 0 ? '▲' : '▼';
    return `
      <div class="card">
        <div class="name">
          <span>${coin.name}</span>
          <span class="symbol">${coin.symbol}</span>
        </div>
        <div class="price">$${coin.current_price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</div>
        <div class="change ${changeClass}">${changeIcon} ${Math.abs(change).toFixed(2)}%</div>
      </div>
    `;
  }).join('');
}

function renderChart(data) {
  const ctx = document.getElementById('marketChart').getContext('2d');
  const labels = data.map(c => c.name);
  const prices = data.map(c => c.current_price);
  
  if (chartInstance) chartInstance.destroy();
  
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Prix (USD)',
        data: prices,
        backgroundColor: 'rgba(212, 175, 55, 0.7)',
        borderColor: '#d4af37',
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => '$' + ctx.raw.toLocaleString('fr-FR')
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#a89880', callback: (v) => '$' + v.toLocaleString() },
          grid: { color: 'rgba(168, 152, 128, 0.1)' }
        },
        x: {
          ticks: { color: '#a89880' },
          grid: { display: false }
        }
      }
    }
  });
}

async function init() {
  try {
    const data = await fetchCryptoData();
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    renderCards(data);
    renderChart(data);
    
    // تحديث تلقائي كل 60 ثانية
    setInterval(async () => {
      try {
        const fresh = await fetchCryptoData();
        renderCards(fresh);
        renderChart(fresh);
      } catch {}
    }, 60000);
  } catch (err) {
    document.getElementById('loading').classList.add('hidden');
    const errorEl = document.getElementById('error');
    errorEl.textContent = 'Échec du chargement : ' + err.message;
    errorEl.classList.remove('hidden');
  }
}

init();