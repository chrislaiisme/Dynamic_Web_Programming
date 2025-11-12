function loadHistory(key, storage) {
  const historyJSON = storage.getItem(key); 
  try {return historyJSON ? JSON.parse(historyJSON) : [];}
  catch (e) {
    console.error(`Error parsing history for key ${key}:`, e);
    return [];
  }
}

function saveGameData() {
  const now = new Date();
  const elapsedTime = Math.floor((now-gameStartTime)/1000);
  const allPlayersLocalData = [];
  for(let i=0; i<PLAYER_COUNT; i++) {
    allPlayersLocalData.push({
      playerIndex: i + 1,
      playerPoints: calculateScore(allPlayerHands[i]),
      playerMoney: allPlayerMoney[i]
    });
  }

  const localData = {
    round,
    playTime: `${elapsedTime}s`,
    dealerPoints: calculateScore(dealerHand),
    players: allPlayersLocalData
  };
  
  const allPlayersSessionData = [];
  for(let i=0; i<PLAYER_COUNT; i++) {
    allPlayersSessionData.push({
      playerIndex: i + 1,
      playerCards: allPlayerHands[i].map(c => `${c.suit}${c.rank}`)
    });
  }
  
  const sessionData = {
    round,
    dealerCards: dealerHand.map(c => `${c.suit}${c.rank}`),
    players: allPlayersSessionData
  };

  const localHistory = loadHistory('localGameRecords', localStorage);
  localHistory.push(localData);
  localStorage.setItem('localGameRecords', JSON.stringify(localHistory));

  const sessionHistory = loadHistory('sessionGameRecords', sessionStorage);
  sessionHistory.push(sessionData);
  sessionStorage.setItem('sessionGameRecords', JSON.stringify(sessionHistory));
}

function displayGameRecords() {
  if(!DOMElements.dataDisplayArea) return; 

  const isCurrentlyDisplayed = (DOMElements.dataDisplayArea.style.display === 'block');
  if(isCurrentlyDisplayed) {
    DOMElements.dataDisplayArea.innerHTML = '';
    DOMElements.dataDisplayArea.style.display = 'none';
    if(DOMElements.message) DOMElements.message.textContent = 'Game records hidden.';
    if(DOMElements.displayDataBtn) DOMElements.displayDataBtn.textContent = 'Show Records';
    return;
  }

  const localHistory   = loadHistory('localGameRecords', localStorage);
  const sessionHistory = loadHistory('sessionGameRecords', sessionStorage);
  
  if(localHistory.length === 0) {
    DOMElements.dataDisplayArea.style.display = 'block';
    DOMElements.dataDisplayArea.innerHTML = '<h2>Game Records</h2><p>No history found.</p>';
    if(DOMElements.message) DOMElements.message.textContent = 'No records found.';
    if(DOMElements.displayDataBtn) DOMElements.displayDataBtn.textContent = 'Hide Records';
    return;
  }

  DOMElements.dataDisplayArea.style.display = 'block';
  DOMElements.dataDisplayArea.innerHTML = '<h2>Game Records</h2>';
  if(DOMElements.displayDataBtn) DOMElements.displayDataBtn.textContent = 'Hide Records';

  const table = document.createElement('table');
  table.className = 'game-record-table';
  table.innerHTML = `
    <thead><tr>
      <th>Round</th> <th>Time</th> <th>Dealer Score</th> <th>Dealer Hand</th> <th>Player</th> <th>Money</th> <th>Score</th> <th>Hand</th>
    </tr></thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');

  localHistory.forEach(localRecord => {
    const sessionRecord = sessionHistory.find(s => s.round === localRecord.round); if(!sessionRecord) return;
    const playersData = (localRecord.players && Array.isArray(localRecord.players)) ? localRecord.players : []; 
    if(playersData.length === 0) return;
    
    const dealerCards = (sessionRecord.dealerCards && Array.isArray(sessionRecord.dealerCards)) ? sessionRecord.dealerCards.join(' / ') : 'N/A';
    
    playersData.forEach((player, playerIndex) => { 
      const row = tbody.insertRow();
      const sessionPlayer = sessionRecord.players.find(sP => sP.playerIndex === player.playerIndex);
      const playerCards = (sessionPlayer && Array.isArray(sessionPlayer.playerCards)) ? sessionPlayer.playerCards.join(' / ') : 'N/A';

      if(playerIndex === 0) {
        row.insertCell().textContent = localRecord.round; row.cells[0].rowSpan = playersData.length;
        row.insertCell().textContent = localRecord.playTime; row.cells[1].rowSpan = playersData.length;
        row.insertCell().textContent = localRecord.dealerPoints; row.cells[2].rowSpan = playersData.length;
        row.insertCell().textContent = dealerCards; row.cells[3].rowSpan = playersData.length;
      }
      row.insertCell().textContent = `P${player.playerIndex}`;
      row.insertCell().textContent = `$${player.playerMoney}`;
      row.insertCell().textContent = player.playerPoints;
      row.insertCell().textContent = playerCards; 
    });
  });

  DOMElements.dataDisplayArea.appendChild(table); 
  if(DOMElements.message) DOMElements.message.textContent = 'Game records displayed.';
}

function clearStorage() {
  localStorage.clear(), sessionStorage.clear();
}

function setupStorageListeners() {
  if(DOMElements.displayDataBtn) DOMElements.displayDataBtn.addEventListener('click', displayGameRecords);
  if(DOMElements.resetBtn) {
    DOMElements.resetBtn.addEventListener('click', () => {
      clearStorage(), resetGameLogic(); 
      if(DOMElements.dataDisplayArea) {
        DOMElements.dataDisplayArea.innerHTML = '';
        DOMElements.dataDisplayArea.style.display = 'none';
      }
      if(DOMElements.displayDataBtn) DOMElements.displayDataBtn.textContent = 'Show Records';
    });
  }
  clearStorage();
}