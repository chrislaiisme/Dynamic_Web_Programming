// OBJECT
const player = {hand: [], score: 0, isBust: false, canPlay: true, money: 100, currentBet: 0};
const dealer = {hand: [], score: 0, isBust: false, isTurn: false};

// GLOBAL STORAGE ARRAY (Used to track history for localStorage)
let gameHistory = [];
let roundCounter = 0;
let startTime = Date.now();

// CONSTANTS
const CARD_IMAGE_PATH = 'cardImage/';
const CARD_BACK_IMAGE = CARD_IMAGE_PATH + 'card_back.png';

// --- STORAGE FUNCTIONS ---

function getElapsedTime() {
  return Math.floor((Date.now() - startTime) / 1000); // Time in seconds
}

function saveGameData() {
  // Collect data for the current round
  const roundData = {
    round: roundCounter,
    playerPoints: player.score,
    playerMoney: player.money,
    dealerPoints: dealer.score,
    playerCards: player.hand,
    dealerCards: dealer.hand
  };

  // 1. Update localStorage (Persistent History)
  const localData = {
    totalRounds: roundCounter,
    playTimeSeconds: getElapsedTime(),
    pointsHistory: gameHistory.map(r => ({p: r.playerPoints, d: r.dealerPoints})),
    moneyHistory: gameHistory.map(r => r.playerMoney)
  };
  localStorage.setItem('blackjackLocalData', JSON.stringify(localData));

  // 2. Update sessionStorage (Current Session Cards/Details)
  const sessionRounds = sessionStorage.getItem('blackjackSessionData') 
    ? JSON.parse(sessionStorage.getItem('blackjackSessionData')) 
    : [];
  
  sessionRounds.push({
    round: roundCounter,
    playerCards: roundData.playerCards,
    dealerCards: roundData.dealerCards
  });
  sessionStorage.setItem('blackjackSessionData', JSON.stringify(sessionRounds));
}

function clearStorage() {
  localStorage.removeItem('blackjackLocalData');
  sessionStorage.removeItem('blackjackSessionData');
  gameHistory = [];
  roundCounter = 0;
  startTime = Date.now();
  document.getElementById('storage-display').style.display = 'none';
  document.getElementById('game-message').textContent = 'The Ancient Ledgers have been wiped clean. Start a fresh game!';
  initializeGame();
}

// --- OPERATION HELPER ---

function getCardName(cardCode) {
  const suits = ["♣", "♦", "♥", "♠"];
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const suitIndex = Math.floor(cardCode / 13), rankIndex = cardCode % 13;
  return `${suits[suitIndex]} ${ranks[rankIndex]}`;
}

function getBaseCardValue(cardCode) {
  const cardRank = (cardCode % 13) + 1;
  if(cardRank === 1) return 1;
  return Math.min(cardRank, 10);
}

function getCardImageName(cardCode) {
  const suitIndex = Math.floor(cardCode / 13);
  const rankIndex = cardCode % 13 + 1; 
  let S = "";

  if      (rankIndex === 1)  S += 'ace';
  else if (rankIndex === 11) S += 'jack';
  else if (rankIndex === 12) S += 'queen';
  else if (rankIndex === 13) S += 'king';
  else                       S += rankIndex.toString();
  
  S += '_of_';
  const a = ['clubs', 'diamonds', 'hearts', 'spades']; // Adjusted to match typical image naming
  S += a[suitIndex];
  return S;
}

function calculateScore(hand) {
  let score = 0, aceCount = 0;
  hand.forEach(cardCode => {
    const baseValue = getBaseCardValue(cardCode);
    if(baseValue === 1) aceCount++;
    score += baseValue;
  });

  for (let i = 0; i < aceCount; i++) {
    if(score + 10 <= 21) score += 10;
    else break;
  }
  return score;
}


// --- OPERATION ---

function dealCard() {return Math.floor(Math.random() * 52);}

function hit() {
  if(!player.canPlay) return;

  const newCard = dealCard();
  player.hand.push(newCard);
  
  updatePlayerScore();
  renderPlayerStatus(newCard); // Pass new card for animation
  renderDealerStatus(); 
  
  if (!player.canPlay) saveGameData(); // Save if player busts/gets 21
}

function stand() {
  if(!player.canPlay && player.score < 21) return;

  player.canPlay = false;
  document.getElementById('game-message').textContent = `✅ Player holds their hand with ${player.score}. The Dealer now acts...`;
  disableButtons();
  
  dealer.isTurn = true;
  renderDealerStatus(true); // Reveal hidden card

  setTimeout(dealerPlay, 1000); 
}

function initializeGame() {
  // Reset state
  player.hand = [];
  player.score = 0;
  player.isBust = false;
  player.canPlay = true; 
  player.currentBet = 10;
  
  dealer.hand = [];
  dealer.score = 0;
  dealer.isBust = false;
  dealer.isTurn = false;
  
  roundCounter++;

  // Load money from storage on the very first start
  if (roundCounter === 1) {
    const storedLocal = localStorage.getItem('blackjackLocalData');
    if (storedLocal) {
      const data = JSON.parse(storedLocal);
      const lastMoney = data.moneyHistory[data.moneyHistory.length - 1];
      player.money = lastMoney !== undefined ? lastMoney : 100;
      // Re-set the start time to now, but keep player money
      startTime = Date.now(); 
    }
  }

  // Remove Next Round button if it exists
  const nextBtn = document.getElementById('next-round-btn');
  if (nextBtn) nextBtn.remove();
  
  // Check if player has enough money to continue
  if (player.money <= 0) {
    document.getElementById('game-message').textContent = "You've run out of coins! The House always wins.";
    disableButtons();
    return;
  }

  player.hand.push(dealCard(), dealCard());
  dealer.hand.push(dealCard(), dealCard());
  
  updatePlayerScore(); 
  renderPlayerStatus(); 
  renderDealerStatus();
  document.getElementById('reset-btn').disabled = false;
  
  document.getElementById('game-message').textContent = `Round ${roundCounter}. Player Coins: ${player.money}. Wager ${player.currentBet}.`;
}

function dealerPlay() {
  dealer.score = calculateScore(dealer.hand);
  
  const playRound = () => {
    if (dealer.score < 17) {
      const newCard = dealCard();
      dealer.hand.push(newCard);
      dealer.score = calculateScore(dealer.hand);
      
      renderDealerStatus(true, newCard); // Pass new card for animation
      
      setTimeout(playRound, 800);
    } else {
      if (dealer.score > 21) {
        dealer.isBust = true;
        document.getElementById('game-message').textContent += ` The Dealer busts (${dealer.score})! Player wins the coin!`;
        payout(true);
      } else {
        document.getElementById('game-message').textContent += ` The Dealer stands at ${dealer.score}.`;
        determineWinner();
      }
      endGame();
    }
  };
  
  playRound();
}

function determineWinner() {
  const pScore = player.score, dScore = dealer.score;
  let message = document.getElementById('game-message').textContent;

  if (pScore > 21 || dScore > 21) return; 

  if (pScore > dScore) {
    message += ' Player\'s score is higher. Player wins the coin!';
    payout(true);
  } else if (dScore > pScore) {
    message += ' Dealer\'s score is higher. The House claims the coin.';
    payout(false);
  } else {
    message += ' Scores are tied. A Push! The wager is returned.';
    payout('push');
  }

  document.getElementById('game-message').textContent = message;
}

function payout(winStatus) {
  if (winStatus === true) {
    player.money += player.currentBet;
  } else if (winStatus === false) {
    player.money -= player.currentBet;
  }
}

function endGame() {
  disableButtons();
  renderDealerStatus(true); 
  
  // Store data after the round is complete
  gameHistory.push({
    round: roundCounter,
    playerPoints: player.score,
    playerMoney: player.money,
    dealerPoints: dealer.score
  });
  saveGameData();

  // Add Next Round button
  const nextRoundBtn = document.createElement('button');
  nextRoundBtn.id = 'next-round-btn';
  nextRoundBtn.textContent = 'Begin Next Round';
  nextRoundBtn.onclick = initializeGame;
  document.querySelector('.actions').appendChild(nextRoundBtn);
}

// --- RENDER ---

function updatePlayerScore() {
  player.score = calculateScore(player.hand);
  
  player.isBust = false;
  player.canPlay = true;
  document.getElementById('hit-btn').disabled = false;
  document.getElementById('stand-btn').disabled = false;

  if (player.score > 21) {
    player.isBust = true;
    player.canPlay = false;
    document.getElementById('game-message').textContent = '🚨 Player is BUST! The House takes the coin.';
    payout(false);
    endGame();
  } else if (player.score === 21) {
    player.canPlay = false;
    document.getElementById('game-message').textContent = '🎉 Blackjack! Hold your breath and await the Dealer.';
    document.getElementById('hit-btn').disabled = true;
  } else {
    document.getElementById('game-message').textContent = 'Choose: Take another card or hold your hand.';
  }
}

function renderHand(hand, elementId, hideSecond = false, newCardCode = null) {
  const container = document.getElementById(elementId);
  container.innerHTML = ''; 

  hand.forEach((cardCode, index) => {
    const img = document.createElement('img');
    let imagePath = CARD_IMAGE_PATH + getCardImageName(cardCode) + '.png';
    let altText = getCardName(cardCode);
    
    // Hide Dealer's second card
    if(hideSecond && index === 1) {
      imagePath = CARD_BACK_IMAGE; 
      altText = 'Hidden Card';
    }
    
    img.src = imagePath;
    img.alt = altText;
    
    // Add animation class if this is the card just dealt
    if (cardCode === newCardCode) {
      img.classList.add('new-card');
    }

    container.appendChild(img);
  });
}

function renderPlayerStatus(newCardCode = null) {
  document.getElementById('player-score').textContent = player.score;
  
  // Render Money display
  let moneyElement = document.getElementById('player-money');
  if (!moneyElement) {
    // Inject money display if not already present (for initial load)
    const p = document.createElement('p');
    p.innerHTML = 'Coins: <span id="player-money"></span>';
    // Append it near the score display
    const scoreElement = document.getElementById('player-status').querySelector('p');
    document.getElementById('player-status').insertBefore(p, scoreElement.nextSibling);
    moneyElement = document.getElementById('player-money');
  }
  moneyElement.textContent = player.money;

  renderHand(player.hand, 'player-hand', false, newCardCode); 
  
  let statusText = 'Awaiting Action';
  if(player.isBust) statusText = '💀 BUST';
  else if(!player.canPlay && !player.isBust && player.score < 21) statusText = '✅ Held Hand';
  else if(player.score === 21) statusText = 'Blackjack!';
  
  const bustElement = document.getElementById('player-bust');
  bustElement.textContent = statusText;
  bustElement.style.color = player.isBust ? 'red' : 'green';
}

function renderDealerStatus(showAll = false, newCardCode = null) {
  let displayScore = '?';
  if (showAll || dealer.isTurn) {
    displayScore = calculateScore(dealer.hand);
    document.getElementById('dealer-score').textContent = displayScore;
  } else {
    displayScore = calculateScore([dealer.hand[0]]);
    document.getElementById('dealer-score').textContent = displayScore + ' + ?';
  }
  
  renderHand(dealer.hand, 'dealer-hand', !showAll && !dealer.isTurn, newCardCode);
}

function disableButtons() {
  document.getElementById('hit-btn').disabled = true;
  document.getElementById('stand-btn').disabled = true;
}

// --- CHEAT / STORAGE DISPLAY ---

function cheatDealerWin() {
  // Simple cheat: Ensure the dealer's score is high when the player clicks Stand
  if (dealer.isTurn || !player.canPlay) {
    document.getElementById('game-message').textContent = 'Cannot cheat now! The hand is already settled.';
    return;
  }
  
  // Force two high cards (e.g., King and Ace) to the dealer's hand
  dealer.hand = [12, 0]; // 12=King of Clubs, 0=Ace of Clubs
  
  document.getElementById('game-message').textContent = 'The Dealer smiles wickedly... Fate has been decided.';
  stand(); // Force the stand action to trigger dealerPlay
}

function displayStorageData() {
  const container = document.getElementById('storage-display');
  const localDiv = document.getElementById('local-storage-data');
  const sessionDiv = document.getElementById('session-storage-data');
  
  // Toggle visibility
  if (container.style.display === 'block') {
    container.style.display = 'none';
    return;
  }
  
  // LOCAL STORAGE DISPLAY
  const localDataStr = localStorage.getItem('blackjackLocalData');
  if (localDataStr) {
    const data = JSON.parse(localDataStr);
    let html = `<h4>Persistent Record (Local Storage)</h4>`;
    html += `<p>Total Rounds Played: ${data.totalRounds}</p>`;
    html += `<p>Total Play Time: ${data.playTimeSeconds} seconds</p>`;
    
    html += '<table><thead><tr><th>Round</th><th>Player Pts</th><th>Dealer Pts</th><th>Player Money</th></tr></thead><tbody>';
    for (let i = 0; i < data.moneyHistory.length; i++) {
      html += `<tr><td>${i + 1}</td><td>${data.pointsHistory[i].p}</td><td>${data.pointsHistory[i].d}</td><td>${data.moneyHistory[i]}</td></tr>`;
    }
    html += '</tbody></table>';
    localDiv.innerHTML = html;
  } else {
    localDiv.innerHTML = '<p>No persistent game records found in Local Storage.</p>';
  }

  // SESSION STORAGE DISPLAY
  const sessionDataStr = sessionStorage.getItem('blackjackSessionData');
  if (sessionDataStr) {
    const sessions = JSON.parse(sessionDataStr);
    let html = `<h4>Current Session Records (Session Storage)</h4>`;
    html += '<table><thead><tr><th>Round</th><th>Player Cards</th><th>Dealer Cards</th></tr></thead><tbody>';
    sessions.forEach(session => {
      html += `<tr><td>${session.round}</td><td>${session.playerCards.map(getCardName).join(', ')}</td><td>${session.dealerCards.map(getCardName).join(', ')}</td></tr>`;
    });
    html += '</tbody></table>';
    sessionDiv.innerHTML = html;
  } else {
    sessionDiv.innerHTML = '<p>No card data found for this session in Session Storage.</p>';
  }

  container.style.display = 'block';
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
  initializeGame();

  document.getElementById('hit-btn').addEventListener('click', hit);
  document.getElementById('stand-btn').addEventListener('click', stand);
  document.getElementById('reset-btn').addEventListener('click', clearStorage);
  
  document.getElementById('display-storage-btn').addEventListener('click', displayStorageData);
  document.getElementById('cheat-btn').addEventListener('click', cheatDealerWin);
});