const STORAGE_KEY = 'dive-pool-trainer-settings-v1';
const LANGUAGE_KEY = 'dive-pool-trainer-language-v1';
const DEFAULT_SETTINGS = { pool: 'FS4 AAA', points: 5, delay: 2000 };
const TRANSLATIONS = window.DivePoolI18n.TRANSLATIONS;
let language = 'en';

function t(key, variables = {}) {
  const template = TRANSLATIONS[language][key] || TRANSLATIONS.en[key] || key;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(variables[name] ?? ''));
}

function pointText(points) {
  if (language === 'uk' && points >= 2 && points <= 4) return t('fewPoints', { count: points });
  return t(points === 1 ? 'onePoint' : 'manyPoints', { count: points });
}

function loadLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return saved && TRANSLATIONS[saved] ? saved : 'en';
  } catch { return 'en'; }
}

const els = {
  language: document.querySelector('#language-select'),
  tabs: [...document.querySelectorAll('[data-tab]')],
  views: [...document.querySelectorAll('.view')],
  activePool: document.querySelector('#active-pool'),
  libraryPool: document.querySelector('#library-pool'),
  roundCount: document.querySelector('#round-count'),
  jumpDisplay: document.querySelector('#jump-display'),
  jumpHint: document.querySelector('#jump-hint'),
  go: document.querySelector('#go-button'),
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
  document.body.classList.toggle('training-mode', name === 'train');
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
  els.pointsOutput.value = pointText(Number(els.pointsRange.value));
  const count = new Intl.NumberFormat(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Number(els.delayRange.value) / 1000);
  els.delayOutput.value = t('seconds', { count });
}

function translatePage() {
  document.documentElement.lang = language;
  els.language.value = language;
  document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = t(element.dataset.i18n); });
  els.search.placeholder = t('searchPlaceholder');
  els.search.setAttribute('aria-label', t('searchLabel'));
  document.querySelector('.tabs').setAttribute('aria-label', t('sectionsLabel'));
  document.querySelector('.filter-buttons').setAttribute('aria-label', t('filterLabel'));
  document.querySelector('.brand').setAttribute('aria-label', t('homeLabel'));
  els.language.setAttribute('aria-label', t('languageLabel'));
  els.reset.setAttribute('aria-label', t('resetButton'));
  els.reset.title = t('resetButton');
  els.dialog.setAttribute('aria-label', t('enlargedFigure'));
  els.dialogClose.setAttribute('aria-label', t('close'));
  updateOutputs();
  updateSessionInfo();
  if (!selected.length) {
    els.jumpDisplay.textContent = t('ready');
    els.jumpHint.textContent = t('startHint');
  } else {
    els.jumpHint.textContent = remaining.length ? t(selected.length === 1 ? 'rememberOne' : 'rememberMany') : t('poolFinished');
    if (els.figureCards.childElementCount) els.revealStatus.textContent = t(selected.length === 1 ? 'shownOne' : 'shownMany', { count: selected.length });
    else els.revealStatus.textContent = t('appearing');
    els.figureCards.replaceChildren(...(els.figureCards.childElementCount ? selected.map(makeFigureCard) : []));
  }
  if (!document.querySelector('#library').hidden) renderLibrary();
}

function resetSession() {
  clearTimeout(revealTimer);
  remaining = [...pools[settings.pool]];
  selected = [];
  rounds = 0;
  els.jumpDisplay.textContent = t('ready');
  els.jumpHint.textContent = t('startHint');
  els.revealStatus.textContent = '';
  els.figureCards.replaceChildren();
  updateSessionInfo();
}

function updateSessionInfo() {
  els.activePool.textContent = settings.pool;
  els.libraryPool.textContent = settings.pool;
  els.roundCount.textContent = t('round', { count: rounds });
  els.remaining.textContent = t('remaining', { count: remaining.length });
  els.pointsLabel.textContent = t('target', { points: pointText(settings.points) });
  els.go.disabled = remaining.length === 0;
  if (remaining.length === 0 && rounds > 0) {
    els.jumpHint.textContent = t('poolFinished');
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
  els.jumpHint.textContent = t(selected.length === 1 ? 'rememberOne' : 'rememberMany');
  els.figureCards.replaceChildren();
  els.revealStatus.textContent = settings.delay ? t('appearing') : '';
  updateSessionInfo();
  revealTimer = setTimeout(revealFigures, settings.delay);
}

function makeFigureCard(item) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'figure-card';
  button.setAttribute('aria-label', t('enlarge', { code: item.code, name: item.name }));

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
  points.textContent = pointText(item.points);
  meta.append(title, points);
  button.append(image, meta);
  button.addEventListener('click', () => showFigure(item));
  return button;
}

function revealFigures() {
  clearTimeout(revealTimer);
  if (!selected.length) return;
  els.figureCards.replaceChildren(...selected.map(makeFigureCard));
  els.revealStatus.textContent = t(selected.length === 1 ? 'shownOne' : 'shownMany', { count: selected.length });
}

function renderLibrary() {
  const query = els.search.value.trim().toLocaleLowerCase();
  const items = pools[settings.pool]
    .map(id => figures.get(id))
    .filter(item => filter === 'all' || (filter === 'random' ? item.points === 1 : item.points === 2))
    .filter(item => `${item.code} ${item.name}`.toLocaleLowerCase().includes(query));
  els.libraryCount.textContent = t('libraryCount', { count: items.length, total: pools[settings.pool].length });
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
    language = loadLanguage();
    resetSession();
    syncSettingsForm();
    translatePage();
  } catch (error) {
    els.jumpDisplay.textContent = t('loadingFailed');
    els.jumpHint.textContent = t('loadingHint');
    els.go.disabled = true;
    console.error('Dive pool kon niet worden geladen:', error);
    return;
  }

  els.tabs.forEach(tab => tab.addEventListener('click', () => openTab(tab.dataset.tab)));
  els.language.addEventListener('change', () => {
    language = els.language.value;
    try { localStorage.setItem(LANGUAGE_KEY, language); } catch { /* Browser storage can be disabled. */ }
    translatePage();
  });
  els.go.addEventListener('click', drawJump);
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
