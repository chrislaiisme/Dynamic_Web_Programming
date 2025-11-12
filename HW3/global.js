let PLAYER_COUNT = 3;
const TOTAL_SOUNDS = 8; 
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const SUITS = ['♠','♥','♦','♣'];

const BASE_DECK = [];
for(const suit of SUITS) for(const rank of RANKS) {
  let value = (['J','Q','K'].includes(rank) ? 10 : (rank==='A' ? 11 : parseInt(rank)));
  BASE_DECK.push({rank, suit, value});
}

let dealerHand = [], allPlayerHands = [], allPlayerMoney = [], allPlayerBets = []; 
let round = 0, gameStartTime = new Date(), currentPlayerIndex = 0;
let isPlaying = false, isCheatMode = false, isBetting = false; 

const DOMElements = {
  // DEALER & PLAYER
  dealerCards: null, dealerScore: null, playersArea: null, playerElements: [],
  // BUTTONS
  startBtn: null, hitBtn: null, standBtn: null, displayDataBtn: null, resetBtn: null, cheatBtn: null,
  // BET
  betInput: null, betBtn: null, currentBetDisplay: null,
  // OHTERS
  message: null, dataDisplayArea: null, playerCountInput: null, setPlayersBtn: null, toggleMusicBtn: null, backgroundMusic: null
};

function initializeDOM() {
  // DEALER & PLAYER
  DOMElements.dealerCards = document.getElementById('dealer-cards');
  DOMElements.dealerScore = document.getElementById('dealer-score');
  DOMElements.playersArea = document.getElementById('players-area');
  // BUTTONS
  DOMElements.hitBtn = document.getElementById('hit-btn');
  DOMElements.standBtn = document.getElementById('stand-btn');
  DOMElements.startBtn = document.getElementById('start-btn');
  DOMElements.displayDataBtn = document.getElementById('display-data-btn');
  DOMElements.resetBtn = document.getElementById('reset-btn');
  DOMElements.cheatBtn = document.getElementById('cheat-btn'); 
  // BET
  DOMElements.betInput = document.getElementById('bet-input'); 
  DOMElements.betBtn = document.getElementById('bet-btn'); 
  DOMElements.currentBetDisplay = document.getElementById('current-bet-display');
  // OTHERS
  DOMElements.message = document.getElementById('game-message');
  DOMElements.dataDisplayArea = document.getElementById('data-display-area');
  DOMElements.playerCountInput = document.getElementById('player-count-input');
  DOMElements.setPlayersBtn = document.getElementById('set-players-btn');
  DOMElements.toggleMusicBtn = document.getElementById('toggle-music-btn');
  DOMElements.backgroundMusic = document.getElementById('background-music');

  // INIT DISPLAY
  for(let i=1; i<=PLAYER_COUNT; i++) {
    const moneyEl = document.getElementById(`player-${i}-money`);
    if(moneyEl) moneyEl.textContent = `$${allPlayerMoney[i-1]}`;
  }
  const statusText = isCheatMode ? "ON" : "OFF";
  if(DOMElements.cheatBtn) {
    DOMElements.cheatBtn.textContent = `Current Cheat ${statusText}`;
    DOMElements.cheatBtn.style.backgroundColor = isCheatMode ? '#d44232' : '#aeb6bb';
    DOMElements.cheatBtn.style.color = isCheatMode ? 'white' : 'black';
  }
}

function initializePlayerStates() {
  allPlayerHands = Array.from({length: PLAYER_COUNT}, () => []  );
  allPlayerMoney = Array.from({length: PLAYER_COUNT}, () => 1000);
  allPlayerBets  = Array.from({length: PLAYER_COUNT}, () => 50  );
  currentPlayerIndex = 0;
}

function calculateScore(hand) {
  let score=0, aceCnt=0;
  for(const card of hand) score += card.value, aceCnt += (card.rank==='A');
  while(score>21 && aceCnt>0) score -= 10, aceCnt--;
  return score;
}

function createPlayerElements() {
  const playersHTML = Array.from({length: PLAYER_COUNT}, (_,i) => {
    return `
      <div id="player-${i+1}-area" class="person-area player">
        <div class="name">Player ${i+1}</div>
        <div>Money: <span id="player-${i+1}-money">$${allPlayerMoney[i]}</span></div>
        <div>Bet: $<span id="player-${i+1}-bet">-</span></div>
        <div>Score: <span id="player-${i+1}-score">-</span></div>
        <div id="player-${i+1}-cards" class="cards-display"></div>
      </div>
    `;
  }).join('');
  DOMElements.playersArea = document.getElementById('players-area');
  if(DOMElements.playersArea) DOMElements.playersArea.innerHTML = playersHTML;
}

function setPlayerCount() {
  if(!DOMElements.playerCountInput) return;
  
  let count = parseInt(DOMElements.playerCountInput.value);
  count = Math.max(count, 1), count = Math.min(count, 5);
  DOMElements.playerCountInput.value = count;
  
  if(count !== PLAYER_COUNT) {
    PLAYER_COUNT = count, initializeApp(false);
    if(DOMElements.message) DOMElements.message.textContent = `Player count set to ${PLAYER_COUNT}. Click "Start Round" to start a round.`;
  }
}

function initializeApp(initialLoad=true) {
  if(initialLoad) PLAYER_COUNT = 3;
  initializePlayerStates(), createPlayerElements(), initializeDOM();
  if(initialLoad) setupStorageListeners(), setupGameListeners();
}

function playRandomSound() {
  const randomIndex = Math.floor(Math.random() * TOTAL_SOUNDS) + 1;
  const soundFile = `./music/${randomIndex}.mp3`;
  const audio = new Audio(soundFile);
  const playPromise = audio.play();

  if(playPromise !== undefined) {
    playPromise.then(_ => {
      audio.addEventListener('ended', () => {audio.remove();});
    }).catch(error => {
      console.warn("Autoplay was prevented. User needs to interact with the page first.");
      audio.remove();
    });
  }
  else audio.addEventListener('ended', () => {audio.remove();});
}

document.addEventListener('DOMContentLoaded', initializeApp);