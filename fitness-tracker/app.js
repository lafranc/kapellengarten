/* ---------- Storage helpers ---------- */

const STORAGE_KEYS = {
  profile: 'ft_profile',
  entries: 'ft_entries',
};

function loadProfile() {
  const raw = localStorage.getItem(STORAGE_KEYS.profile);
  return raw ? JSON.parse(raw) : null;
}

function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
}

function loadEntries() {
  const raw = localStorage.getItem(STORAGE_KEYS.entries);
  return raw ? JSON.parse(raw) : [];
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(entries));
}

/* ---------- IndexedDB for photos ---------- */

const DB_NAME = 'fitness_tracker_db';
const DB_VERSION = 1;
const PHOTO_STORE = 'photos';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function addPhoto(photo) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    const store = tx.objectStore(PHOTO_STORE);
    const req = store.add(photo);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAllPhotos() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readonly');
    const store = tx.objectStore(PHOTO_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function deletePhoto(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    const store = tx.objectStore(PHOTO_STORE);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/* ---------- Utilities ---------- */

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function calcBmi(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function bmiCategory(bmi) {
  if (bmi == null) return '';
  if (bmi < 18.5) return 'Untergewicht';
  if (bmi < 25) return 'Normalgewicht';
  if (bmi < 30) return 'Übergewicht';
  return 'Adipositas';
}

/* ---------- Tab navigation ---------- */

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'dashboard') renderDashboard();
    if (btn.dataset.tab === 'photos') renderPhotos();
  });
});

/* ---------- Profile form ---------- */

const profileForm = document.getElementById('profile-form');

function fillProfileForm() {
  const profile = loadProfile();
  if (!profile) {
    document.getElementById('profile-start-date').value = todayStr();
    const goal = new Date();
    goal.setMonth(goal.getMonth() + 2);
    document.getElementById('profile-goal-date').value = goal.toISOString().slice(0, 10);
    return;
  }
  document.getElementById('profile-height').value = profile.height ?? '';
  document.getElementById('profile-start-weight').value = profile.startWeight ?? '';
  document.getElementById('profile-goal-weight').value = profile.goalWeight ?? '';
  document.getElementById('profile-goal-waist').value = profile.goalWaist ?? '';
  document.getElementById('profile-start-date').value = profile.startDate ?? todayStr();
  document.getElementById('profile-goal-date').value = profile.goalDate ?? '';
  document.getElementById('profile-goal-text').value = profile.goalText ?? '';
}

profileForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const profile = {
    height: parseFloat(document.getElementById('profile-height').value) || null,
    startWeight: parseFloat(document.getElementById('profile-start-weight').value) || null,
    goalWeight: parseFloat(document.getElementById('profile-goal-weight').value) || null,
    goalWaist: parseFloat(document.getElementById('profile-goal-waist').value) || null,
    startDate: document.getElementById('profile-start-date').value,
    goalDate: document.getElementById('profile-goal-date').value,
    goalText: document.getElementById('profile-goal-text').value,
  };
  saveProfile(profile);
  alert('Profil & Ziel gespeichert!');
  renderDashboard();
});

/* ---------- Diary form ---------- */

const entryForm = document.getElementById('entry-form');
document.getElementById('entry-date').value = todayStr();

entryForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const entry = {
    date: document.getElementById('entry-date').value,
    weight: parseFloat(document.getElementById('entry-weight').value) || null,
    waist: parseFloat(document.getElementById('entry-waist').value) || null,
    calories: parseInt(document.getElementById('entry-calories').value) || null,
    food: document.getElementById('entry-food').value.trim(),
    exercise: document.getElementById('entry-exercise').value.trim(),
    duration: parseInt(document.getElementById('entry-duration').value) || null,
    notes: document.getElementById('entry-notes').value.trim(),
  };

  if (!entry.weight && !entry.food && !entry.exercise && !entry.notes && !entry.waist) {
    alert('Bitte trage mindestens einen Wert ein.');
    return;
  }

  const entries = loadEntries();
  // Replace existing entry for the same date if present
  const existingIdx = entries.findIndex(en => en.date === entry.date);
  if (existingIdx >= 0) {
    entries[existingIdx] = { ...entries[existingIdx], ...entry };
  } else {
    entries.push(entry);
  }
  entries.sort((a, b) => a.date.localeCompare(b.date));
  saveEntries(entries);

  entryForm.reset();
  document.getElementById('entry-date').value = todayStr();

  renderEntries();
  renderDashboard();
});

function renderEntries() {
  const entries = loadEntries().slice().sort((a, b) => b.date.localeCompare(a.date));
  const container = document.getElementById('entries-list');
  if (entries.length === 0) {
    container.innerHTML = '<p class="empty-hint">Noch keine Einträge. Trage oben deinen ersten Tag ein.</p>';
    return;
  }
  container.innerHTML = entries.map(en => {
    const parts = [];
    if (en.weight) parts.push(`Gewicht: ${en.weight} kg`);
    if (en.waist) parts.push(`Bauchumfang: ${en.waist} cm`);
    if (en.calories) parts.push(`${en.calories} kcal`);
    if (en.exercise) parts.push(`Training: ${en.exercise}${en.duration ? ' (' + en.duration + ' Min)' : ''}`);
    const meta = parts.join(' · ');
    const extras = [];
    if (en.food) extras.push(`<div>🍽️ ${escapeHtml(en.food)}</div>`);
    if (en.notes) extras.push(`<div>📝 ${escapeHtml(en.notes)}</div>`);
    return `
      <div class="entry-item">
        <button class="entry-delete" data-date="${en.date}">Löschen</button>
        <div class="entry-date">${formatDate(en.date)}</div>
        <div class="entry-meta">${meta}</div>
        ${extras.join('')}
      </div>`;
  }).join('');

  container.querySelectorAll('.entry-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Diesen Eintrag wirklich löschen?')) return;
      const entries = loadEntries().filter(en => en.date !== btn.dataset.date);
      saveEntries(entries);
      renderEntries();
      renderDashboard();
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- Photo form ---------- */

const photoForm = document.getElementById('photo-form');
document.getElementById('photo-date').value = todayStr();

photoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = document.getElementById('photo-file').files[0];
  if (!file) return;
  const date = document.getElementById('photo-date').value;
  const note = document.getElementById('photo-note').value.trim();

  const dataUrl = await fileToDataUrl(file);
  await addPhoto({ date, note, dataUrl });

  photoForm.reset();
  document.getElementById('photo-date').value = todayStr();
  renderPhotos();
});

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function renderPhotos() {
  const photos = (await getAllPhotos()).sort((a, b) => a.date.localeCompare(b.date));

  // Grid
  const grid = document.getElementById('photo-grid');
  if (photos.length === 0) {
    grid.innerHTML = '<p class="empty-hint">Noch keine Fotos hochgeladen.</p>';
  } else {
    grid.innerHTML = photos.map(p => `
      <figure>
        <img src="${p.dataUrl}" alt="Fortschrittsfoto ${formatDate(p.date)}">
        <figcaption>${formatDate(p.date)}${p.note ? '<br>' + escapeHtml(p.note) : ''}</figcaption>
        <button class="photo-delete" data-id="${p.id}">Löschen</button>
      </figure>
    `).join('');

    grid.querySelectorAll('.photo-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Dieses Foto wirklich löschen?')) return;
        await deletePhoto(parseInt(btn.dataset.id));
        renderPhotos();
      });
    });
  }

  // Compare selects
  const selA = document.getElementById('compare-a');
  const selB = document.getElementById('compare-b');
  const options = photos.map(p => `<option value="${p.id}">${formatDate(p.date)}${p.note ? ' – ' + escapeHtml(p.note) : ''}</option>`).join('');
  selA.innerHTML = options;
  selB.innerHTML = options;

  if (photos.length >= 2) {
    selA.value = photos[0].id;
    selB.value = photos[photos.length - 1].id;
  } else if (photos.length === 1) {
    selA.value = selB.value = photos[0].id;
  }

  function updateCompare() {
    const view = document.getElementById('compare-view');
    if (photos.length === 0) {
      view.innerHTML = '';
      return;
    }
    const a = photos.find(p => p.id === parseInt(selA.value));
    const b = photos.find(p => p.id === parseInt(selB.value));
    view.innerHTML = [a, b].map(p => p ? `
      <div class="compare-col">
        <img src="${p.dataUrl}" alt="Foto ${formatDate(p.date)}">
        <div class="compare-caption">${formatDate(p.date)}${p.note ? ' – ' + escapeHtml(p.note) : ''}</div>
      </div>` : '').join('');
  }

  selA.onchange = updateCompare;
  selB.onchange = updateCompare;
  updateCompare();
}

/* ---------- Dashboard ---------- */

let weightChart = null;

function renderDashboard() {
  const profile = loadProfile();
  const entries = loadEntries().slice().sort((a, b) => a.date.localeCompare(b.date));
  const cards = document.getElementById('summary-cards');
  const goalProgress = document.getElementById('goal-progress');

  if (!profile) {
    cards.innerHTML = '<div class="summary-card"><div class="label">Bitte zuerst dein Profil & Ziel unter "Profil & Ziel" eintragen.</div></div>';
    goalProgress.innerHTML = '';
    if (weightChart) { weightChart.destroy(); weightChart = null; }
    return;
  }

  const weightEntries = entries.filter(e => e.weight != null);
  const latest = weightEntries[weightEntries.length - 1];
  const currentWeight = latest ? latest.weight : profile.startWeight;
  const currentBmi = calcBmi(currentWeight, profile.height);
  const startBmi = calcBmi(profile.startWeight, profile.height);

  const weightChange = profile.startWeight != null && currentWeight != null
    ? (currentWeight - profile.startWeight)
    : null;

  const cardData = [
    { label: 'Aktuelles Gewicht', value: currentWeight != null ? `${currentWeight} kg` : '–' },
    { label: 'BMI', value: currentBmi != null ? `${currentBmi.toFixed(1)}` : '–', sub: bmiCategory(currentBmi) },
    { label: 'Veränderung', value: weightChange != null ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg` : '–' },
  ];

  cards.innerHTML = cardData.map(c => `
    <div class="summary-card">
      <div class="value">${c.value}</div>
      <div class="label">${c.label}${c.sub ? ' · ' + c.sub : ''}</div>
    </div>
  `).join('');

  // Goal progress
  let html = '';
  if (profile.startDate && profile.goalDate) {
    const start = new Date(profile.startDate);
    const goal = new Date(profile.goalDate);
    const now = new Date();
    const totalDays = Math.max(1, (goal - start) / 86400000);
    const elapsedDays = Math.min(totalDays, Math.max(0, (now - start) / 86400000));
    const timePct = Math.round((elapsedDays / totalDays) * 100);
    const daysLeft = Math.max(0, Math.ceil((goal - now) / 86400000));

    html += `<div class="progress-text">Zeitlicher Fortschritt: Tag ${Math.round(elapsedDays)} von ${Math.round(totalDays)} (${daysLeft} Tage bis ${formatDate(profile.goalDate)})</div>`;
    html += `<div class="progress-bar"><div class="progress-fill" style="width:${timePct}%"></div></div>`;
  }

  if (profile.goalWeight != null && profile.startWeight != null && currentWeight != null) {
    const totalChange = profile.goalWeight - profile.startWeight;
    const currentChange = currentWeight - profile.startWeight;
    let weightPct = totalChange !== 0 ? Math.round((currentChange / totalChange) * 100) : 0;
    weightPct = Math.max(0, Math.min(100, weightPct));
    html += `<div class="progress-text">Gewichtsziel: ${profile.startWeight} kg → ${profile.goalWeight} kg (aktuell ${currentWeight} kg)</div>`;
    html += `<div class="progress-bar"><div class="progress-fill" style="width:${weightPct}%"></div></div>`;
  }

  if (profile.goalText) {
    html += `<p class="empty-hint">🎯 ${escapeHtml(profile.goalText)}</p>`;
  }

  if (!html) {
    html = '<p class="empty-hint">Trage ein Zieldatum und/oder Zielgewicht im Profil ein, um deinen Fortschritt zu sehen.</p>';
  }

  goalProgress.innerHTML = html;

  // Chart
  const ctx = document.getElementById('weightChart');
  const labels = weightEntries.map(e => formatDate(e.date));
  const weights = weightEntries.map(e => e.weight);
  const bmis = weightEntries.map(e => {
    const b = calcBmi(e.weight, profile.height);
    return b != null ? Math.round(b * 10) / 10 : null;
  });

  if (weightChart) weightChart.destroy();

  if (weightEntries.length === 0) {
    ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
    return;
  }

  weightChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Gewicht (kg)',
          data: weights,
          borderColor: '#2f9e6e',
          backgroundColor: 'rgba(47,158,110,0.1)',
          yAxisID: 'y',
          tension: 0.2,
        },
        {
          label: 'BMI',
          data: bmis,
          borderColor: '#3a7bd5',
          backgroundColor: 'rgba(58,123,213,0.1)',
          yAxisID: 'y1',
          tension: 0.2,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: { type: 'linear', position: 'left', title: { display: true, text: 'kg' } },
        y1: { type: 'linear', position: 'right', title: { display: true, text: 'BMI' }, grid: { drawOnChartArea: false } },
      },
    },
  });
}

/* ---------- Export / Reset ---------- */

document.getElementById('export-btn').addEventListener('click', async () => {
  const data = {
    profile: loadProfile(),
    entries: loadEntries(),
    photos: await getAllPhotos(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fortschritt-tracker-export-${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('reset-btn').addEventListener('click', async () => {
  if (!confirm('Wirklich ALLE Daten (Profil, Tagebuch, Fotos) unwiderruflich löschen?')) return;
  localStorage.removeItem(STORAGE_KEYS.profile);
  localStorage.removeItem(STORAGE_KEYS.entries);
  const photos = await getAllPhotos();
  for (const p of photos) await deletePhoto(p.id);
  fillProfileForm();
  renderEntries();
  renderPhotos();
  renderDashboard();
});

/* ---------- Init ---------- */

fillProfileForm();
renderEntries();
renderPhotos();
renderDashboard();
