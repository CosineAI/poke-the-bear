// Poke the Bear Game Implementation

// ==== DOM Elements ====
const setupPanel = document.getElementById('setupPanel');
const gamePanel = document.getElementById('gamePanel');
const playerCountInput = document.getElementById('playerCountInput');
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
let turnOrder = []; // array of player numbers [1,2,...]
let currentTurnIndex = 0;
let currentProb = 1;
let perPokeIncrement = 1;
let hasPokedThisTurn = false;
let lullabyUsed = [];
let gameActive = false;

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
function updateProbDisplay() {
  probDisplay.textContent = formatPercent(currentProb);
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
    li.textContent = `Player ${pNum}`;
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
}

// Current player
function updateCurrentPlayerUI() {
  if (!gameActive) {
    currentPlayerLabel.textContent = '';
    return;
  }
  const pNum = turnOrder[currentTurnIndex];
  currentPlayerLabel.textContent = `Turn: Player ${pNum}`;
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
  gameOverMsg.innerHTML = `<b>The bear woke and ate Player ${loserPlayerNum}!<br>Take a drink! 🐻🍺</b><br><button id="btnGameOverNew" class="primary-btn" style="margin-top:1em;">New Game</button>`;
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

// ==== Game Logic ====
function startGame() {
  playersCount = clamp(parseInt(playerCountInput.value, 10) || 4, 2, 12);
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
  const pNum = turnOrder[currentTurnIndex];
  // Wake check
  const wake = Math.random() * 100 < currentProb;
  logAction(`Player ${pNum} poked: ${wake ? 'the bear woke up!' : 'survived.'} Chance was ${formatPercent(currentProb)}`);
  if (wake) {
    // Game over
    logAction(`Player ${pNum} was eaten! Game Over.`);
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
  updateTurnListUI();
  updateCurrentPlayerUI();
  setActionsEnabled(true);
}

function endTurn() {
  if (!hasPokedThisTurn || !gameActive) return;
  const pNum = turnOrder[currentTurnIndex];
  logAction(`Player ${pNum} ended turn.`);
  advanceTurn();
}

function useLullaby() {
  if (!gameActive) return;
  const pNum = turnOrder[currentTurnIndex];
  if (lullabyUsed[pNum]) return;
  lullabyUsed[pNum] = true;
  // Reduce probability by 10 (clamp at 0)
  const before = currentProb;
  currentProb = clamp(currentProb - 10, 0, 100);
  updateProbDisplay();
  logAction(`Player ${pNum} used Lullaby: chance now ${formatPercent(currentProb)}`);
  updateTurnListUI();
  // Immediately end turn
  logAction(`Player ${pNum} ended turn.`);
  advanceTurn();
}

function doResetGame() {
  // Restore all to initial state
  setSlidersEnabled(true);
  playerCountInput.value = "4";
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
  probDisplay.textContent = formatPercent(sliderInitial.value);
}

// ==== Event Listeners ====

// Start Game
startBtn.addEventListener('click', () => {
  startGame();
});

// Poke
btnPoke.addEventListener('click', () => {
  if (!gameActive) return;
  // Don't allow to poke if game is over
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

// Sliders sync
sliderInitial.addEventListener('input', () => {
  syncSlidersReverse();
  updateSliderDisplays();
  probDisplay.textContent = formatPercent(sliderInitial.value);
});
sliderIncrement.addEventListener('input', () => {
  syncSlidersReverse();
  updateSliderDisplays();
});
sliderInitialBottom.addEventListener('input', () => {
  syncSliders();
  updateSliderDisplays();
  probDisplay.textContent = formatPercent(sliderInitialBottom.value);
});
sliderIncrementBottom.addEventListener('input', () => {
  syncSliders();
  updateSliderDisplays();
});

// Player count input clamp
playerCountInput.addEventListener('input', () => {
  let val = parseInt(playerCountInput.value, 10);
  if (isNaN(val) || val < 2) {
    playerCountInput.value = 2;
  } else if (val > 12) {
    playerCountInput.value = 12;
  }
});

// When game over "New Game" button is shown inside the message, it is dynamically created and attached

// ==== Initialization ====
function init() {
  updateSliderDisplays();
  setSlidersEnabled(true);
  showSetupPanel();
  clearLog();
  probDisplay.textContent = formatPercent(sliderInitial.value);
  // Hide game over msg
  gameOverMsg.style.display = 'none';
  // Remove any lingering event handlers from previous dynamic new game button
  if (document.getElementById('btnGameOverNew')) {
    document.getElementById('btnGameOverNew').onclick = null;
  }
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