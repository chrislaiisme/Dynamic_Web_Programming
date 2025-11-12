function getRandomCard() {return {...BASE_DECK[Math.floor(Math.random()*BASE_DECK.length)]};}

function getPlayerDom(type, index=currentPlayerIndex) {
  const playerId = index + 1;
  if(type==='score') return document.getElementById(`player-${playerId}-score`);
  if(type==='cards') return document.getElementById(`player-${playerId}-cards`);
  if(type==='money') return document.getElementById(`player-${playerId}-money`);
  if(type==='bet'  ) return document.getElementById(`player-${playerId}-bet`  );
  if(type==='area' ) return document.getElementById(`player-${playerId}-area` );
}

function updateScores() {
  const currentPlayerHand = allPlayerHands[currentPlayerIndex];
  const playerScoreEl = getPlayerDom('score');
  if(playerScoreEl) { 
    const currentplayerScore = calculateScore(currentPlayerHand);
    playerScoreEl.textContent = `${currentplayerScore}`;
    if(currentplayerScore>21) playerScoreEl.textContent += '(Bust)';
  }
  
  let dealerDisplayScore;
  const dealerCardElements = DOMElements.dealerCards ? DOMElements.dealerCards.children : [];
  
  if(dealerHand.length>=2 && dealerCardElements.length>=2) {
    const isSecondCardHidden = dealerCardElements[1].classList.contains('hidden-card');
    if(isSecondCardHidden) dealerDisplayScore = dealerHand[0].value;
    else dealerDisplayScore = calculateScore(dealerHand);
  }
  else dealerDisplayScore = calculateScore(dealerHand);

  if(DOMElements.dealerScore) {
    DOMElements.dealerScore.textContent = `${dealerDisplayScore}`;
    if(dealerDisplayScore>21) DOMElements.dealerScore.textContent += '(Bust)';
  }
}

function dealCard(targetHand, targetEl, isHidden = false) {
  let card = getRandomCard();
  if(isCheatMode && targetEl==DOMElements.dealerCards && targetHand.length>=2) {
    const score = Math.min(13, 21-calculateScore(targetHand));
    card = {...BASE_DECK[score-1]};
  } 
  targetHand.push(card);

  const cardEl = document.createElement('div');
  cardEl.className = 'card';
  cardEl.textContent = isHidden ? '?' : `${card.suit}${card.rank}`;
  if(isHidden) cardEl.classList.add('hidden-card');
  if(targetEl) targetEl.appendChild(cardEl);
}

function toggleControls(hitStand, betting, nextBtn, dealBtn) {
  if(DOMElements.hitBtn) DOMElements.hitBtn.disabled   = !hitStand;
  if(DOMElements.standBtn) DOMElements.standBtn.disabled = !hitStand;
  if(DOMElements.betInput) DOMElements.betInput.disabled = !betting;
  if(DOMElements.betBtn) DOMElements.betBtn.disabled   = !betting;
  if(DOMElements.nextBtn) DOMElements.nextBtn.disabled  = !nextBtn; 
  if(DOMElements.startBtn) DOMElements.startBtn.disabled = !dealBtn;

  const isGameActive = hitStand || betting; 
  if(DOMElements.setPlayersBtn) DOMElements.setPlayersBtn.disabled = isGameActive;
}

function updatePlayerHighlight(index) {
  for(let i=0; i<PLAYER_COUNT; i++) {
    const areaEl = getPlayerDom('area', i);
    if(areaEl) areaEl.style.border = (i===index) ? '2px solid gold' : '1px solid #cccccc';
  }
}

function resetRound() {
  allPlayerHands = Array.from({length: PLAYER_COUNT}, () => []), dealerHand = [], gameStartTime = new Date(), currentPlayerIndex = 0;
}

function startRound() { 
  if(isPlaying || isBetting) return;
  
  isPlaying = false, isBetting = true, round++;
  resetRound();
  
  for(let i=0; i<PLAYER_COUNT; i++) {
    const cardsEl = getPlayerDom('cards', i); if(cardsEl) cardsEl.innerHTML   = ' ';
    const betEl   = getPlayerDom('bet', i);   if(betEl) betEl.textContent     = '-';
    const scoreEl = getPlayerDom('score', i); if(scoreEl) scoreEl.textContent = '-';
  }

  if(DOMElements.dealerCards) DOMElements.dealerCards.innerHTML = '';
  if(DOMElements.dealerScore) DOMElements.dealerScore.textContent = '-';
  
  updatePlayerHighlight(currentPlayerIndex);
  
  if(DOMElements.message) DOMElements.message.textContent = `Round ${round}: Player ${currentPlayerIndex+1}, please set your bet.`;
  
  const currentBet=50;
  allPlayerBets[currentPlayerIndex]=50;

  if(DOMElements.betInput) DOMElements.betInput.value = currentBet;
  if(DOMElements.currentBetDisplay) DOMElements.currentBetDisplay.textContent = currentBet;

  toggleControls(false, true, false, true);
  if(DOMElements.startBtn) DOMElements.startBtn.disabled = true;
}

function setBetAction() {
  if(!isBetting) return;
  
  if(!DOMElements.betInput) return;
  const betInput = DOMElements.betInput;

  const newBet = parseInt(betInput.value);
  const currentMoney = allPlayerMoney[currentPlayerIndex];

  if(newBet>currentMoney) {
    if(DOMElements.message) DOMElements.message.textContent = `Player ${currentPlayerIndex+1} doesn't have enough money ($${currentMoney}) for $${newBet}.`;
    return;
  }
  
  allPlayerBets[currentPlayerIndex] = newBet;
  const betEl = getPlayerDom('bet', currentPlayerIndex);
  if(betEl) betEl.textContent = newBet;
  if(DOMElements.message) DOMElements.message.textContent = `Player ${currentPlayerIndex+1} bets $${newBet}.`;

  if(currentPlayerIndex+1 < PLAYER_COUNT) nextPlayerRound();
  else isBetting = false, dealInitialCards();
}

function dealInitialCards() {
  isPlaying = true, currentPlayerIndex = 0;

  for(let i=0; i<PLAYER_COUNT; i++) {
    const bet = allPlayerBets[i]; allPlayerMoney[i] -= bet;
    const moneyEl = getPlayerDom('money', i); 
    if(moneyEl) moneyEl.textContent = `$${allPlayerMoney[i]}`;
  }
  
  for(let i=0; i<2; i++) {
    for(let j=0; j<PLAYER_COUNT; j++) {
      const currentCardsEl = getPlayerDom('cards', j);
      dealCard(allPlayerHands[j], currentCardsEl); 
    }
    dealCard(dealerHand, DOMElements.dealerCards, (i===1)); 
  }

  updatePlayerHighlight(currentPlayerIndex);
  const currentHand = allPlayerHands[currentPlayerIndex];
  
  if(DOMElements.message) DOMElements.message.textContent = `Player ${currentPlayerIndex+1}'s turn. Hit or Stand?`;
  toggleControls(true, false, false, true);
  updateScores();
}

function hitAction() {
  if(!isPlaying) return;
  const currentPlayerHand = allPlayerHands[currentPlayerIndex];
  const currentCardsEl = getPlayerDom('cards');
  
  dealCard(currentPlayerHand, currentCardsEl), updateScores();
  if(calculateScore(currentPlayerHand)>21) nextPlayerRound();
}

function standAction() {
  if(!isPlaying) return;
  nextPlayerRound();
}

function dealerPlay() {
  toggleControls(false, false, false, true), updatePlayerHighlight(-1); 

  if(DOMElements.dealerCards) {
    if(DOMElements.dealerCards.children.length>1) {
      DOMElements.dealerCards.children[1].classList.remove('hidden-card');
      DOMElements.dealerCards.children[1].textContent = `${dealerHand[1].suit}${dealerHand[1].rank}`; 
    }
  }
  updateScores();

  while((!isCheatMode && calculateScore(dealerHand)<17) || (isCheatMode && calculateScore(dealerHand)<21)) {
    dealCard(dealerHand, DOMElements.dealerCards);
    updateScores();
  }

  if(DOMElements.message) DOMElements.message.textContent = "Dealer finished playing. Payout...";
  payout();
}

function nextPlayerRound() {
  if(isBetting) {
    currentPlayerIndex++;
    updatePlayerHighlight(currentPlayerIndex);
    if(DOMElements.message) DOMElements.message.textContent = `Player ${currentPlayerIndex+1}, please set your bet.`;

    const currentBet=50;
    allPlayerBets[currentPlayerIndex]=50;
    if(DOMElements.betInput) DOMElements.betInput.value = currentBet;
    if(DOMElements.currentBetDisplay) DOMElements.currentBetDisplay.textContent = currentBet;

    toggleControls(false, true, false, true); 
    
    if(currentPlayerIndex === PLAYER_COUNT-1 && DOMElements.nextBtn) DOMElements.nextBtn.disabled = true;
    return;
  }
  
  currentPlayerIndex++;
  if(currentPlayerIndex >= PLAYER_COUNT) {dealerPlay(); return;}

  const nextPlayerHand = allPlayerHands[currentPlayerIndex];
  updatePlayerHighlight(currentPlayerIndex);

  updateScores();
  if(DOMElements.message) DOMElements.message.textContent = `Player ${currentPlayerIndex+1}'s turn. Hit or Stand?`;
  toggleControls(true, false, false, true); 
}

function payout() {
  toggleControls(false, false, false, false); 
  const dealerScore = calculateScore(dealerHand);
  const dealerBust = dealerScore>21;
  let finalMessage = "Payouts: ";

  for(let i=0; i<PLAYER_COUNT; i++) {
    const currentPlayerHand = allPlayerHands[i];
    if(currentPlayerHand.length===0) continue; 
    
    const playerScore = calculateScore(currentPlayerHand);
    let currentPlayerMoney = allPlayerMoney[i]; 
    const currentPlayerBet = allPlayerBets[i]; 
    let resultMessage = '';

    if(playerScore>21) resultMessage = "P" + (i+1) + ": Bust (Lost)";
    else if(dealerBust) currentPlayerMoney += currentPlayerBet*2, resultMessage = "P" + (i+1) + ": Wins";
    else if(playerScore>dealerScore) currentPlayerMoney += currentPlayerBet*2, resultMessage = "P" + (i+1) + ": Wins";
    else if(playerScore<dealerScore) resultMessage = "P" + (i+1) + ": Lost";
    else currentPlayerMoney += currentPlayerBet, resultMessage = "P" + (i+1) + ": Push (Bet returned)";

    allPlayerMoney[i] = currentPlayerMoney;
    const moneyEl = getPlayerDom('money', i);
    if(moneyEl) moneyEl.textContent = `$${allPlayerMoney[i]}`;
    
    finalMessage += resultMessage + ". ";
  }

  saveGameData(); 
  if(DOMElements.message) DOMElements.message.textContent = finalMessage;
  isPlaying = false; 
  if(DOMElements.startBtn) DOMElements.startBtn.disabled = false;
}

function resetGameLogic() { 
  initializePlayerStates();
  round = 0, gameStartTime = new Date(), isPlaying = false, isBetting = false, dealerHand = [], currentPlayerIndex = 0;
  
  for(let i=0; i<PLAYER_COUNT; i++) {
    const moneyEl = getPlayerDom('money', i); if(moneyEl) moneyEl.textContent = `$${allPlayerMoney[i]}`;
    const cardsEl = getPlayerDom('cards', i); if(cardsEl) cardsEl.innerHTML = '';
    const scoreEl = getPlayerDom('score', i); if(scoreEl) scoreEl.textContent = '-';
    const betEl = getPlayerDom('bet', i); if(betEl) betEl.textContent = '-';
    updatePlayerHighlight(-1);
  }

  if(DOMElements.dealerCards) DOMElements.dealerCards.innerHTML = '';
  if(DOMElements.dealerScore) DOMElements.dealerScore.textContent = `-`;
  if(DOMElements.message) DOMElements.message.textContent = `Game reset. Funds $1000 for all players. Click "Start Round" to start a round.`;
  
  toggleControls(false, false, false, false);
  if(DOMElements.startBtn) DOMElements.startBtn.disabled = false;
  
  if(isCheatMode && DOMElements.cheatBtn) {
    isCheatMode = false;
    DOMElements.cheatBtn.textContent = "Current Cheat OFF";
    DOMElements.cheatBtn.style.backgroundColor = '#bdc3c7';
    DOMElements.cheatBtn.style.color = 'black';
  }
}

function setupGameListeners() {
  if(DOMElements.startBtn) DOMElements.startBtn.addEventListener('click', startRound);
  if(DOMElements.hitBtn) DOMElements.hitBtn.addEventListener('click', hitAction);
  if(DOMElements.standBtn) DOMElements.standBtn.addEventListener('click', standAction);
  if(DOMElements.betBtn) DOMElements.betBtn.addEventListener('click', setBetAction);
  if(DOMElements.setPlayersBtn) DOMElements.setPlayersBtn.addEventListener('click', setPlayerCount);

  if(DOMElements.betInput && DOMElements.currentBetDisplay) {
    DOMElements.betInput.addEventListener('input', () => {
      DOMElements.currentBetDisplay.textContent = DOMElements.betInput.value;
    });
  }

  if(DOMElements.dataDisplayArea) {
    DOMElements.dataDisplayArea.innerHTML = '';
    DOMElements.dataDisplayArea.style.display = 'none'; 
  }

  if(DOMElements.displayDataBtn) DOMElements.displayDataBtn.textContent = 'Show Records';

  if(DOMElements.cheatBtn) {
    DOMElements.cheatBtn.addEventListener('click', () => {
      isCheatMode = !isCheatMode;
      const statusText = isCheatMode ? "ON" : "OFF";
      DOMElements.cheatBtn.textContent = `Current Cheat ${statusText}`;
      DOMElements.cheatBtn.style.backgroundColor = isCheatMode ? '#e74c3c' : '#bdc3c7';
      DOMElements.cheatBtn.style.color = 'white';
      if(DOMElements.message) DOMElements.message.textContent = `Cheat mode switched to: ${statusText}.`;
    });
  }
  
  if(DOMElements.toggleMusicBtn && DOMElements.backgroundMusic) {
    DOMElements.toggleMusicBtn.addEventListener('click', () => {
      const music = DOMElements.backgroundMusic;
      const btn = DOMElements.toggleMusicBtn;

      if(music.paused) music.play(), btn.textContent = 'Pause BGM';
      else music.pause(), btn.textContent = 'Play BGM';
      if(DOMElements.message) DOMElements.message.textContent = music.paused ? 'Background music paused.' : 'Background music playing.';
    });
  }

  const actionButtons = [
    DOMElements.startBtn, DOMElements.hitBtn, DOMElements.standBtn, DOMElements.betBtn, 
    DOMElements.setPlayersBtn,DOMElements.resetBtn,DOMElements.cheatBtn,DOMElements.displayDataBtn
  ];
  actionButtons.forEach(btn => {if(btn) btn.addEventListener('click', playRandomSound);});

  toggleControls(false, false, false, false);
  if(DOMElements.startBtn) DOMElements.startBtn.disabled = false;
}