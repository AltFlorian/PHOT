const API = '/api/v1/tanklevels';
const maxFuelLevel = 185.0;

// Darkmode Umschalter
const themeToggle = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'light';
document.body.setAttribute('data-theme', currentTheme);
themeToggle.textContent = currentTheme === 'light' ? '🌙' : '🌞';

themeToggle.addEventListener('click', () => {
  const newTheme = document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  themeToggle.textContent = newTheme === 'light' ? '🌙' : '🌞';
});

// Daten laden und anzeigen
async function loadAll() {
  const data = await (await fetch(API + '/?offset=0&limit=100')).json();
  const tbody = document.querySelector('tbody');
  tbody.innerHTML = '';
  data.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${t.id}</td>
      <td>${t.fuel_level ?? ''}</td>
      <td>${new Date(t.measured_on).toLocaleDateString('de-DE')}</td>
      <td>
        <button class="mui-btn mui-btn--small edit" data-id="${t.id}">✏️</button>
        <button class="mui-btn mui-btn--small mui-btn--danger delete" data-id="${t.id}">🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  });
  updateChart(data);
}

// Chart.js aktualisieren
function updateChart(data) {
  const labels = data.map(t => new Date(t.measured_on).toLocaleDateString('de-DE'));
  const fuelLevels = data.map(t => t.fuel_level ?? 0);

  const ctx = document.getElementById('fuelChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Füllstand',
        data: fuelLevels,
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        fill: true,
        tension: 0.1
      }, {
        label: 'Maximalfüllstand',
        data: Array(data.length).fill(maxFuelLevel),
        borderColor: '#f44336',
        backgroundColor: 'rgba(244, 67, 54, 0.2)',
        fill: true,
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          min: 0,
          max: maxFuelLevel,
          title: {
            display: true,
            text: 'Füllstand (cm)'
          }
        }
      }
    }
  });
}

document.getElementById('load').addEventListener('click', loadAll);

document.getElementById('create-form').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target;
  await fetch(API, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      fuel_level: f.fuel_level.value || null,
      measured_on: f.measured_on.value
    })
  });
  f.reset();
  loadAll();
});

document.querySelector('tbody').addEventListener('click', async e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.classList.contains('delete')) {
    if (confirm(`Eintrag ${id} wirklich löschen?`)) {
      await fetch(API + `/${id}`, {method: 'DELETE'});
      loadAll();
    }
  } else if (btn.classList.contains('edit')) {
    const res = await fetch(API + `/${id}`);
    const t = await res.json();
    const f = document.getElementById('edit-form');
    f.id.value = t.id;
    f.fuel_level.value = t.fuel_level ?? '';
    f.measured_on.value = new Date(t.measured_on).toISOString().split('T')[0];
    document.getElementById('edit-section').style.display = 'block';
  }
});

document.getElementById('edit-form').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target;
  await fetch(API + `/${f.id.value}`, {
    method: 'PATCH',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      fuel_level: f.fuel_level.value || null,
      measured_on: f.measured_on.value
    })
  });
  f.reset();
  document.getElementById('edit-section').style.display = 'none';
  loadAll();
});

document.getElementById('cancel-edit').addEventListener('click', () => {
  document.getElementById('edit-section').style.display = 'none';
});

loadAll();
