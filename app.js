const STORAGE_KEY = 'dive-pool-trainer-settings-v1';
const DEFAULT_SETTINGS = { pool: 'FS4 AAA', points: 5, delay: 2000 };

const els = {
  tabs: [...document.querySelectorAll('[data-tab]')],
  views: [...document.querySelectorAll('.view')],
  activePool: document.querySelector('#active-pool'),
  libraryPool: document.querySelector('#library-pool'),
  roundCount: document.querySelector('#round-count'),
  jumpDisplay: document.querySelector('#jump-display'),
  jumpHint: document.querySelector('#jump-hint'),
  go: document.querySelector('#go-button'),
  reveal: document.querySelector('#reveal-button'),
  reset: document.querySelector('#reset-button'),
  remaining: document.querySelector('#remaining-count'),
  pointsLabel: document.querySelector('#points-label'),
  revealStatus: document.querySelector('#reveal-status'),
  figureCards: document.querySelector('#figure-cards'),
  search: document.querySelector('#search-input'),
  filters: [...document.querySelectorAll('[data-filter]')],
  libraryCount: document.querySelector('#library-count'),
  libraryGrid: document.querySelector('#library-grid'),
  poolSelect: document.querySelector('#pool-select'),
  pointsRange: document.querySelector('#points-range'),
  pointsOutput: document.querySelector('#points-output'),
  delayRange: document.querySelector('#delay-range'),
  delayOutput: document.querySelector('#delay-output'),
  save: document.querySelector('#save-button'),
  dialog: document.querySelector('#figure-dialog'),
  dialogImage: document.querySelector('#dialog-image'),
  dialogCaption: document.querySelector('#dialog-caption'),
  dialogClose: document.querySelector('#dialog-close'),
};

let figures = new Map();
let pools = {};
let settings = { ...DEFAULT_SETTINGS };
let remaining = [];
let selected = [];
let rounds = 0;
let revealTimer;
let filter = 'all';

function readSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      pool: typeof saved.pool === 'string' && pools[saved.pool] ? saved.pool : DEFAULT_SETTINGS.pool,
      points: Number.isInteger(saved.points) && saved.points >= 1 && saved.points <= 5 ? saved.points : DEFAULT_SETTINGS.points,
      delay: Number.isInteger(saved.delay) && saved.delay >= 0 && saved.delay <= 5000 ? saved.delay : DEFAULT_SETTINGS.delay,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function openTab(name) {
  els.views.forEach(view => { view.hidden = view.id !== name; });
  els.tabs.forEach(tab => {
    const active = tab.dataset.tab === name;
    tab.classList.toggle('is-active', active);
    if (active) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });
  if (name === 'library') renderLibrary();
  if (name === 'settings') syncSettingsForm();
}

function syncSettingsForm() {
  els.poolSelect.value = settings.pool;
  els.pointsRange.value = settings.points;
  els.delayRange.value = settings.delay;
  updateOutputs();
}

function updateOutputs() {
  els.pointsOutput.value = `${els.pointsRange.value} ${els.pointsRange.value === '1' ? 'punt' : 'punten'}`;
  els.delayOutput.value = `${(Number(els.delayRange.value) / 1000).toFixed(1).replace('.', ',')} seconden`;
}

function resetSession() {
  clearTimeout(revealTimer);
  remaining = [...pools[settings.pool]];
  selected = [];
  rounds = 0;
  els.jumpDisplay.textContent = 'Klaar voor de start';
  els.jumpHint.textContent = 'Druk op GO om een nieuwe combinatie te krijgen.';
  els.revealStatus.textContent = '';
  els.figureCards.replaceChildren();
  els.reveal.disabled = true;
  updateSessionInfo();
}

function updateSessionInfo() {
  els.activePool.textContent = settings.pool;
  els.libraryPool.textContent = settings.pool;
  els.roundCount.textContent = `Ronde ${rounds}`;
  els.remaining.textContent = `${remaining.length} figuren over`;
  els.pointsLabel.textContent = `Doel: ${settings.points} ${settings.points === 1 ? 'punt' : 'punten'}`;
  els.go.disabled = remaining.length === 0;
  if (remaining.length === 0 && rounds > 0) {
    els.jumpHint.textContent = 'Pool voltooid. Start opnieuw voor een nieuwe reeks.';
  }
}

function drawJump() {
  if (!remaining.length) return;
  clearTimeout(revealTimer);
  selected = [];
  let total = 0;
  while (remaining.length && total < settings.points) {
    const index = Math.floor(Math.random() * remaining.length);
    const [id] = remaining.splice(index, 1);
    selected.push(figures.get(id));
    total += figures.get(id).points;
  }
  rounds += 1;
  els.jumpDisplay.textContent = selected.map(item => item.code).join(' – ');
  els.jumpHint.textContent = `Onthoud de figuren achter deze ${selected.length === 1 ? 'code' : 'codes'}.`;
  els.figureCards.replaceChildren();
  els.revealStatus.textContent = settings.delay ? 'De figuren verschijnen zo…' : '';
  els.reveal.disabled = false;
  updateSessionInfo();
  revealTimer = setTimeout(revealFigures, settings.delay);
}

function makeFigureCard(item) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'figure-card';
  button.setAttribute('aria-label', `${item.code}: ${item.name}. Vergroot figuur.`);

  const image = document.createElement('img');
  image.src = `./${item.image}`;
  image.alt = `${item.code}: ${item.name}`;
  image.loading = 'lazy';

  const meta = document.createElement('div');
  meta.className = 'figure-meta';
  const title = document.createElement('span');
  const code = document.createElement('strong');
  code.className = 'figure-code';
  code.textContent = item.code;
  const name = document.createElement('span');
  name.className = 'figure-name';
  name.textContent = item.name;
  title.append(code, name);
  const points = document.createElement('span');
  points.className = 'figure-points';
  points.textContent = item.points === 1 ? '1 punt' : '2 punten';
  meta.append(title, points);
  button.append(image, meta);
  button.addEventListener('click', () => showFigure(item));
  return button;
}

function revealFigures() {
  clearTimeout(revealTimer);
  if (!selected.length) return;
  els.figureCards.replaceChildren(...selected.map(makeFigureCard));
  els.revealStatus.textContent = `${selected.length} ${selected.length === 1 ? 'figuur' : 'figuren'} getoond. Tik op een afbeelding om te vergroten.`;
  els.reveal.disabled = true;
}

function renderLibrary() {
  const query = els.search.value.trim().toLocaleLowerCase();
  const items = pools[settings.pool]
    .map(id => figures.get(id))
    .filter(item => filter === 'all' || (filter === 'random' ? item.points === 1 : item.points === 2))
    .filter(item => `${item.code} ${item.name}`.toLocaleLowerCase().includes(query));
  els.libraryCount.textContent = `${items.length} van ${pools[settings.pool].length} figuren`;
  els.libraryGrid.replaceChildren(...items.map(makeFigureCard));
}

function showFigure(item) {
  els.dialogImage.src = `./${item.image}`;
  els.dialogImage.alt = `${item.code}: ${item.name}`;
  els.dialogCaption.textContent = `${item.code} · ${item.name}`;
  els.dialog.showModal();
}

async function start() {
  try {
    const response = await fetch('./data/pool.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    figures = new Map(data.figures.map(item => [item.id, item]));
    pools = data.pools;
    settings = readSettings();
    resetSession();
    syncSettingsForm();
  } catch (error) {
    els.jumpDisplay.textContent = 'Laden mislukt';
    els.jumpHint.textContent = 'Vernieuw de pagina wanneer je weer verbinding hebt.';
    els.go.disabled = true;
    console.error('Dive pool kon niet worden geladen:', error);
    return;
  }

  els.tabs.forEach(tab => tab.addEventListener('click', () => openTab(tab.dataset.tab)));
  els.go.addEventListener('click', drawJump);
  els.reveal.addEventListener('click', revealFigures);
  els.reset.addEventListener('click', resetSession);
  els.search.addEventListener('input', renderLibrary);
  els.filters.forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    els.filters.forEach(item => item.classList.toggle('is-active', item === button));
    renderLibrary();
  }));
  els.pointsRange.addEventListener('input', updateOutputs);
  els.delayRange.addEventListener('input', updateOutputs);
  els.save.addEventListener('click', () => {
    const next = {
      pool: els.poolSelect.value,
      points: Number(els.pointsRange.value),
      delay: Number(els.delayRange.value),
    };
    const poolChanged = next.pool !== settings.pool;
    settings = next;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* Browser storage can be disabled. */ }
    if (poolChanged) resetSession();
    else updateSessionInfo();
    openTab('train');
  });
  els.dialogClose.addEventListener('click', () => els.dialog.close());
  els.dialog.addEventListener('click', event => { if (event.target === els.dialog) els.dialog.close(); });

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Offline opslag niet beschikbaar:', error));
  }
}

start();
