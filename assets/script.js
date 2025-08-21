// ==== DOM Elements ====
const setupPanel = document.getElementById('setupPanel');
const gamePanel = document.getElementById('gamePanel');
const playerCountInput = document.getElementById('playerCountInput');
const playerNamesContainer = document.getElementById('playerNamesContainer');
const startBtn = document.getElementById('startBtn');
const btnPoke = document.getElementById('btnPoke');
const btnEndTurn = document.getElementById('btnEndTurn');
const btnLullaby = document.getElementById('btnLullaby');
const btnNewGame = document.getElementById('btnNewGame');
const probDisplay = document.getElementById('probDisplay');
const turnList = document.getElementById('turnList');
const logArea = document.getElementById('log');
const gameOverMsg = document.getElementById('gameOverMsg');
const currentPlayerLabel = document.getElementById('currentPlayer');
const btnToggleLog = document.getElementById('btnToggleLog');
const btnToggleSettings = document.getElementById('btnToggleSettings');
const sliderControls = document.querySelector('.slider-controls');
const pokeCountBadge = document.getElementById('pokeCount');

// Sliders (both setup and bottom controls)
const sliderInitial = document.getElementById('sliderInitial');
const sliderIncrement = document.getElementById('sliderIncrement');
const labelInitial = document.getElementById('labelInitial');
const labelIncrement = document.getElementById('labelIncrement');

const sliderInitialBottom = document.getElementById('sliderInitialBottom');
const sliderIncrementBottom = document.getElementById('sliderIncrementBottom');
const labelInitialBottom = document.getElementById('labelInitialBottom');
const labelIncrementBottom = document.getElementById('labelIncrementBottom');

// ==== Game State ====
let playersCount = 4;
let turnOrder = []; // array of player indices (1..N)
let currentTurnIndex = 0;
let currentProb = 1;
let perPokeIncrement = 1;
let hasPokedThisTurn = false;
let lullabyUsed = [];
let gameActive = false;
let totalPokes = 0;
let namesByIndex = {}; // maps player 1..N to name string

// ==== LocalStorage Helpers ====
const LS_PLAYER_COUNT = 'ptb_playerCount';
const LS_PLAYER_NAMES = 'ptb_playerNames';

function getDefaultName(i) {
  return `Player ${i}`;
}

function getNamesFromInputs(count) {
  const arr = [];
  for (let i = 1; i <= count; i++) {
    const el = document.getElementById(`playerName_${i}`);
    const v = (el?.value || '').trim();
    arr.push(v || getDefaultName(i));
  }
  return arr;
}

function renderNameInputs(count, presetNames = []) {
  const frag = document.createDocumentFragment();
  for (let i = 1; i <= count; i++) {
    const wrap = document.createElement('div');
    wrap.className = 'name-field';
    const lab = document.createElement('label');
    lab.setAttribute('for', `playerName_${i}`);
    lab.textContent = `Player ${i} Name`;
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.id = `playerName_${i}`;
    inp.placeholder = getDefaultName(i);
    inp.value = (presetNames[i - 1] && presetNames[i - 1].trim()) || '';
    wrap.appendChild(lab);
    wrap.appendChild(inp);
    frag.appendChild(wrap);
  }
  playerNamesContainer.innerHTML = '';
  playerNamesContainer.appendChild(frag);
}

function savePlayerPrefs() {
  localStorage.setItem(LS_PLAYER_COUNT, String(playerCountInput.value));
  const namesArr = getNamesFromInputs(parseInt(playerCountInput.value, 10) || 4);
  localStorage.setItem(LS_PLAYER_NAMES, JSON.stringify(namesArr));
}

function loadPlayerPrefs() {
  const pc = localStorage.getItem(LS_PLAYER_COUNT);
  if (pc) playerCountInput.value = pc;
  const pn = localStorage.getItem(LS_PLAYER_NAMES);
  if (pn === null) return [];
  try {
    const arr = JSON.parse(pn);
    if (Array.isArray(arr)) return arr;
  } catch (e) {}
  // fallback for old textarea format
  return pn.split('\n').map(s => s.trim()).filter(Boolean);
}

const restlessBear = [
  "The bear shifts in its dreams.",
  "The bear lets out a heavy sigh.",
  "The bear twitches its ear.",
  "The bear mumbles in its sleep.",
  "The bear rolls onto its back.",
  "The bear paws at the air.",
  "The bear’s breath comes in huffs.",
  "The bear shivers for a moment.",
  "The bear flicks its tail.",
  "The bear curls tighter in the den.",
  "The bear growls softly.",
  "The bear stretches a hind leg.",
  "The bear exhales a warm gust.",
  "The bear turns its head slowly.",
  "The bear’s chest rises and falls.",
  "The bear stirs without waking.",
  "The bear lets out a low rumble.",
  "The bear kicks lightly in its sleep.",
  "The bear breathes with a steady pace.",
  "The bear growls in a dream.",
  "The bear scratches its side.",
  "The bear moves its paws in slow motion.",
  "The bear flinches at something unseen.",
  "The bear’s nose twitches.",
  "The bear grunts, then settles.",
  "The bear breathes deep and slow.",
  "The bear mutters in its slumber.",
  "The bear stretches both front legs.",
  "The bear rolls half onto its stomach.",
  "The bear tucks its snout under a paw.",
  "The bear lets out a snuffling breath.",
  "The bear’s fur shifts softly with each breath.",
  "The bear’s ears twitch at faint sounds.",
  "The bear flattens one paw to the ground.",
  "The bear lets out a short, sharp snore.",
  "The bear shakes its head in a dream.",
  "The bear shifts its weight from side to side.",
  "The bear’s paws curl and uncurl.",
  "The bear grumbles faintly.",
  "The bear tilts its head to one side.",
  "The bear exhales through its nose.",
  "The bear pushes out a low hum.",
  "The bear loosens its limbs.",
  "The bear settles deeper into the den.",
  "The bear coughs in its sleep.",
  "The bear pulls its legs closer.",
  "The bear breathes in a slow, rattling sound.",
  "The bear scratches at the dirt.",
  "The bear moves its claws slightly.",
  "The bear flutters its eyelids.",
  "The bear’s tail gives the smallest twitch.",
  "The bear yawns without waking.",
  "The bear’s nose sniffs at nothing.",
  "The bear shifts closer to the den wall.",
  "The bear exhales warm, misty air into the cold.",
  "The bear jerks awake for a moment, then sleeps on.",
  "The bear hums low in its throat."
];

// ==== Utility Functions ====
function shuffle(array) {
  // Fisher-Yates in-place shuffle
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(num, max));
}

function formatPercent(val) {
  return `${Math.round(val)}%`;
}

// Risk label function
function riskLabel(p) {
  p = clamp(p, 0, 100);
  if (p <= 8) return "Low risk";
  if (p <= 16) return "Gettin' dicey";
  if (p <= 24) return "Are you sure you want to keep going?";
  if (p <= 30) return "Your middle name is Danger";
  return "Incredible bravery (or stupidity)?";
}

function scrollLogToBottom() {
  setTimeout(() => {
    logArea.scrollTop = logArea.scrollHeight;
  }, 25);
}

// ==== UI Update Functions ====
function updateSliderDisplays() {
  labelInitial.textContent = formatPercent(sliderInitial.value);
  labelIncrement.textContent = `+${Math.round(sliderIncrement.value)}%`;

  labelInitialBottom.textContent = formatPercent(sliderInitialBottom.value);
  labelIncrementBottom.textContent = `+${Math.round(sliderIncrementBottom.value)}%`;
}

function syncSliders() {
  // Keep setup and bottom sliders in sync
  sliderInitial.value = sliderInitialBottom.value;
  sliderIncrement.value = sliderIncrementBottom.value;
  updateSliderDisplays();
}
function syncSlidersReverse() {
  sliderInitialBottom.value = sliderInitial.value;
  sliderIncrementBottom.value = sliderIncrement.value;
  updateSliderDisplays();
}

// Lock/unlock sliders
function setSlidersEnabled(enabled) {
  sliderInitial.disabled = !enabled;
  sliderIncrement.disabled = !enabled;
  sliderInitialBottom.disabled = !enabled;
  sliderIncrementBottom.disabled = !enabled;
}

// Show/hide panels
function showSetupPanel() {
  setupPanel.style.display = '';
  gamePanel.style.display = 'none';
  gameOverMsg.style.display = 'none';
}

function showGamePanel() {
  setupPanel.style.display = 'none';
  gamePanel.style.display = '';
  gameOverMsg.style.display = 'none';
}

// Probability display
function updateProbDisplay(val) {
  // Always show risk label for the currentProb (or optional override value)
  let probVal = typeof val === 'number' ? val : currentProb;
  probDisplay.textContent = riskLabel(probVal);
  labelInitial.textContent = formatPercent(sliderInitial.value);
  labelInitialBottom.textContent = formatPercent(sliderInitialBottom.value);
  labelIncrement.textContent = `+${sliderIncrement.value}%`;
  labelIncrementBottom.textContent = `+${sliderIncrementBottom.value}%`;
}

// Turn order list
function updateTurnListUI() {
  turnList.innerHTML = '';
  for (let i = 0; i < turnOrder.length; i++) {
    const pNum = turnOrder[i];
    const li = document.createElement('li');
    li.textContent = namesByIndex[pNum] || getDefaultName(pNum);
    if (i === currentTurnIndex && gameActive) {
      li.classList.add('current');
    }
    // Lullaby badge if used
    const badge = document.createElement('span');
    if (lullabyUsed[pNum]) {
      badge.className = 'lullaby-badge';
      badge.innerHTML = `<i>🎶</i> Lullaby used`;
      li.appendChild(badge);
    }
    turnList.appendChild(li);
  }
// Current player
function updateCurrentPlayerUI() {
  if (!gameActive) {
    currentPlayerLabel.textContent = '';
    return;
  }
  const pNum = turnOrder[currentTurnIndex];
  currentPlayerLabel.textContent = `Turn: ${namesByIndex[pNum] || getDefaultName(pNum)}`;
}

// Action buttons
function setActionsEnabled(enabled) {
  btnPoke.disabled = !enabled;
  btnLullaby.disabled = !enabled ||
    lullabyUsed[turnOrder[currentTurnIndex]];
  btnEndTurn.disabled = !enabled || !hasPokedThisTurn;
}

// Game over UI
function showGameOver(loserPlayerNum) {
  gameActive = false;
  setActionsEnabled(false);
  const loserName = namesByIndex[loserPlayerNum] || getDefaultName(loserPlayerNum);
  gameOverMsg.innerHTML = `<b>The bear woke and ate ${loserName}!<br>Take a drink! 🐻🍺</b><br><button id="btnGameOverNew" class="primary-btn" style="margin-top:1em;">New Game</button>`;
  gameOverMsg.style.display = '';
  // Ensure focus for accessibility
  const btnOver = gameOverMsg.querySelector('#btnGameOverNew');
  if (btnOver) {
    btnOver.onclick = doResetGame;
    btnOver.focus();
  }
}

// Action log
function logAction(msg) {
  const div = document.createElement('div');
  div.className = 'action-log-entry';
  div.textContent = msg;
  logArea.appendChild(div);
  scrollLogToBottom();
}

function clearLog() {
  logArea.innerHTML = '';
}

// ==== Poke Count Badge ====
function updatePokeBadge() {
  pokeCountBadge.textContent = `Pokes: ${totalPokes}`;
}
function showPokeBadge() {
  pokeCountBadge.style.display = '';
}
function hidePokeBadge() {
  pokeCountBadge.style.display = 'none';
}

// ==== Game Logic ====
function startGame() {
  playersCount = clamp(parseInt(playerCountInput.value, 10) || 4, 2, 12);

  // Build names array from dynamic inputs, fill/truncate as needed
  let namesArr = getNamesFromInputs(playersCount);
  namesByIndex = {};
  for (let i = 1; i <= playersCount; i++) {
    namesByIndex[i] = namesArr[i - 1] || getDefaultName(i);
  }

  // Save player count and names to localStorage
  savePlayerPrefs();

  // Sliders to be in sync
  perPokeIncrement = clamp(parseInt(sliderIncrement.value, 10), 1, 20);
  currentProb = clamp(parseInt(sliderInitial.value, 10), 0, 100);
  sliderInitial.value = currentProb;
  sliderInitialBottom.value = currentProb;
  sliderIncrement.value = perPokeIncrement;
  sliderIncrementBottom.value = perPokeIncrement;

  // Initialize turn order and state
  turnOrder = Array.from({length: playersCount}, (_, i) => i + 1);
  shuffle(turnOrder);
  currentTurnIndex = 0;
  hasPokedThisTurn = false;
  lullabyUsed = {};
  for (let i = 1; i <= playersCount; i++) lullabyUsed[i] = false;
  gameActive = true;

  // Poke counter
  totalPokes = 0;
  updatePokeBadge();

  // Lock sliders
  setSlidersEnabled(false);

  // UI updates
  updateProbDisplay();
  updateTurnListUI();
  updateCurrentPlayerUI();
  setActionsEnabled(true);
  clearLog();
  showGamePanel();
  gameOverMsg.style.display = 'none';

  // Hide log, show poke badge
  logArea.style.display = 'none';
  btnToggleLog.textContent = "Show Log";
  showPokeBadge();
}

function advanceTurn() {
  hasPokedThisTurn = false;
  currentTurnIndex = (currentTurnIndex + 1) % turnOrder.length;
  updateTurnListUI();
  updateCurrentPlayerUI();
  setActionsEnabled(true);
}

function pokeBear() {
  if (!gameActive) return;
  totalPokes++;
  updatePokeBadge();
  const pNum = turnOrder[currentTurnIndex];
  const name = namesByIndex[pNum] || getDefaultName(pNum);
  // Wake check
  const wake = Math.random() * 100 < currentProb;
  logAction(`${name} poked: ${wake ? 'the bear woke up!' : 'survived.'} Chance was ${formatPercent(currentProb)}`);
  if (wake) {
    // Game over
    logAction(`${name} was eaten! Game Over.`);
    showGameOver(pNum);
    updateProbDisplay();
    updateTurnListUI();
    updateCurrentPlayerUI();
    return;
  }
  hasPokedThisTurn = true;
  btnEndTurn.disabled = false;
  // Increase probability
  currentProb = clamp(currentProb + perPokeIncrement, 0, 100);
  updateProbDisplay();
  logAction(`Chance now ${formatPercent(currentProb)}`);
  // Add restless bear sentence
  const sentence = restlessBear[Math.floor(Math.random() * restlessBear.length)];
  logAction(sentence);
  updateTurnListUI();
  updateCurrentPlayerUI();
  setActionsEnabled(true);
}

function endTurn() {
  if (!hasPokedThisTurn || !gameActive) return;
  const pNum = turnOrder[currentTurnIndex];
  const name = namesByIndex[pNum] || getDefaultName(pNum);
  logAction(`${name} ended turn.`);
  advanceTurn();
}

function useLullaby() {
  if (!gameActive) return;
  const pNum = turnOrder[currentTurnIndex];
  if (lullabyUsed[pNum]) return;
  lullabyUsed[pNum] = true;
  const name = namesByIndex[pNum] || getDefaultName(pNum);
  // Reduce probability by 10 (clamp at 0)
  const before = currentProb;
  currentProb = clamp(currentProb - 10, 0, 100);
  updateProbDisplay();
  logAction(`${name} used Lullaby: chance now ${formatPercent(currentProb)}`);
  updateTurnListUI();
  // Immediately end turn
  logAction(`${name} ended turn.`);
  advanceTurn();
}

function doResetGame() {
  // Restore all to initial state, but keep playerCountInput and names as user set (do not reset!)
  setSlidersEnabled(true);
  sliderInitial.value = "1";
  sliderInitialBottom.value = "1";
  sliderIncrement.value = "1";
  sliderIncrementBottom.value = "1";
  updateSliderDisplays();
  clearLog();
  showSetupPanel();
  gameActive = false;
  hasPokedThisTurn = false;
  turnOrder = [];
  lullabyUsed = {};
  currentTurnIndex = 0;
  currentPlayerLabel.textContent = '';
  updateProbDisplay(parseInt(sliderInitial.value, 10));
  // Set poke badge to 0 and show
  totalPokes = 0;
  updatePokeBadge();
  showPokeBadge();
  // Hide log by default
  logArea.style.display = 'none';
  btnToggleLog.textContent = "Show Log";
}

// ==== Event Listeners ====

// Start Game
startBtn.addEventListener('click', () => {
  startGame();
});

// Poke
btnPoke.addEventListener('click', () => {
  if (!gameActive) return;
  pokeBear();
});

// End Turn
btnEndTurn.addEventListener('click', () => {
  if (!gameActive || !hasPokedThisTurn) return;
  endTurn();
});

// Lullaby
btnLullaby.addEventListener('click', () => {
  if (!gameActive) return;
  useLullaby();
});

// New Game (in panel)
btnNewGame.addEventListener('click', doResetGame);

// Action Log Toggle
btnToggleLog.addEventListener('click', () => {
  if (logArea.style.display === 'none' || logArea.classList.contains('hidden')) {
    logArea.style.display = '';
    btnToggleLog.textContent = "Hide Log";
    hidePokeBadge();
  } else {
    logArea.style.display = 'none';
    btnToggleLog.textContent = "Show Log";
    showPokeBadge();
  }
});

// Settings (bottom slider-controls) Toggle
btnToggleSettings.addEventListener('click', () => {
  if (sliderControls.style.display === 'none' || sliderControls.classList.contains('hidden')) {
    sliderControls.style.display = '';
    btnToggleSettings.textContent = "Hide Settings";
  } else {
    sliderControls.style.display = 'none';
    btnToggleSettings.textContent = "Settings";
  }
});

// Sliders sync
sliderInitial.addEventListener('input', () => {
  syncSlidersReverse();
  updateSliderDisplays();
  updateProbDisplay(parseInt(sliderInitial.value, 10));
});
sliderIncrement.addEventListener('input', () => {
  syncSlidersReverse();
  updateSliderDisplays();
});
sliderInitialBottom.addEventListener('input', () => {
  syncSliders();
  updateSliderDisplays();
  updateProbDisplay(parseInt(sliderInitialBottom.value, 10));
});
sliderIncrementBottom.addEventListener('input', () => {
  syncSliders();
  updateSliderDisplays();
});

// Player count input clamp and preserve names
playerCountInput.addEventListener('input', () => {
  let val = parseInt(playerCountInput.value, 10);
  if (isNaN(val) || val < 2) {
    playerCountInput.value = 2;
  } else if (val > 12) {
    playerCountInput.value = 12;
  }
  // Read names so far:
  const oldCount = playerNamesContainer.querySelectorAll('.name-field input[type="text"]').length;
  const oldNames = [];
  for (let i = 1; i <= oldCount; i++) {
    const el = document.getElementById(`playerName_${i}`);
    oldNames.push((el?.value || '').trim());
  }
  // Render new inputs, preserving old where possible
  const newCount = parseInt(playerCountInput.value, 10) || 4;
  renderNameInputs(newCount, oldNames);
  savePlayerPrefs();
});

// Delegate input events for name fields to save on change
playerNamesContainer.addEventListener('input', function (e) {
  if (e.target && e.target.matches('input[type="text"]')) {
    savePlayerPrefs();
  }
});

// ==== Initialization ====
function init() {
  // Load prefs
  const savedNames = loadPlayerPrefs();
  const count = parseInt(playerCountInput.value, 10) || 4;
  renderNameInputs(count, savedNames);

  updateSliderDisplays();
  setSlidersEnabled(true);
  showSetupPanel();
  clearLog();
  // Hide game over msg
  gameOverMsg.style.display = 'none';
  // Hide log and set toggle button to Show Log
  logArea.style.display = 'none';
  btnToggleLog.textContent = "Show Log";
  showPokeBadge();
  totalPokes = 0;
  updatePokeBadge();
  // Hide slider-controls and set settings btn
  sliderControls.style.display = 'none';
  btnToggleSettings.textContent = "Settings";
  // Remove any lingering event handlers from previous dynamic new game button
  if (document.getElementById('btnGameOverNew')) {
    document.getElementById('btnGameOverNew').onclick = null;
  }
  // Set risk label display for initial slider value
  updateProbDisplay(parseInt(sliderInitial.value, 10));
}

window.addEventListener('DOMContentLoaded', init);

// Accessibility: allow Enter to start game from setup
playerCountInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    startGame();
  }
});

// Prevent accidental double poke/endturn
btnPoke.addEventListener('dblclick', (e) => e.preventDefault());
btnEndTurn.addEventListener('dblclick', (e) => e.preventDefault());
btnLullaby.addEventListener('dblclick', (e) => e.preventDefault());