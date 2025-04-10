// DOM Elements
const roundCountEl = document.getElementById('round-count');
const playersContainer = document.getElementById('players-container');
const activeLoansContainer = document.getElementById('active-loans-container');
const paidLoansContainer = document.getElementById('paid-loans-container');
const historyContainer = document.getElementById('history-container');
const addPlayerModal = document.getElementById('add-player-modal');
const createLoanModal = document.getElementById('create-loan-modal');
const toast = document.getElementById('toast');

// Game State
let players = [];
let dealer = {
  id: 'dealer',
  name: 'Dealer',
  points: 1000,
  currentBet: 0,
  loans: []
};
let gameHistory = [];
let roundCounter = 0;

function resetGame() {
  localStorage.removeItem('blackjack-players');
  localStorage.removeItem('blackjack-dealer');
  localStorage.removeItem('blackjack-history');
  localStorage.removeItem('blackjack-round');
}

// Initialize the game
function initGame() {
  // Load data from localStorage
  const savedPlayers = localStorage.getItem('blackjack-players');
  const savedDealer = localStorage.getItem('blackjack-dealer');
  const savedHistory = localStorage.getItem('blackjack-history');
  const savedRound = localStorage.getItem('blackjack-round');

  if (savedPlayers) players = JSON.parse(savedPlayers);
  if (savedDealer) dealer = JSON.parse(savedDealer);
  if (savedHistory) gameHistory = JSON.parse(savedHistory);
  if (savedRound) roundCounter = parseInt(savedRound);

  // Update UI
  updateRoundCounter();
  renderPlayers();
  renderLoans();
  renderHistory();
}

// Save game state to localStorage
function saveGameState() {
  localStorage.setItem('blackjack-players', JSON.stringify(players));
  localStorage.setItem('blackjack-dealer', JSON.stringify(dealer));
  localStorage.setItem('blackjack-history', JSON.stringify(gameHistory));
  localStorage.setItem('blackjack-round', roundCounter.toString());
}

// Update round counter display
function updateRoundCounter() {
  roundCountEl.textContent = roundCounter;
}

// Render players
function renderPlayers() {
  // Update dealer card
  const dealerCard = document.getElementById('dealer-card');
  const dealerPointsEl = dealerCard.querySelector('.player-points');
  dealerPointsEl.textContent = `${dealer.points} pts`;

  // Render player cards
  playersContainer.innerHTML = '';
  
  if (players.length === 0) {
    playersContainer.innerHTML = '<p class="no-loans-message">No players added yet</p>';
    return;
  }

  players.forEach(player => {
    const playerCard = document.createElement('div');
    playerCard.className = 'player-card';
    playerCard.dataset.id = player.id;

    playerCard.innerHTML = `
      <div class="player-info">
        <div class="player-name">
          <h3>${player.name}</h3>
        </div>
        <div class="player-points">${player.points} pts</div>
      </div>
      <div class="bet-controls">
        <input type="number" class="bet-input" placeholder="Bet amount" min="0" max="${player.points}" value="${player.currentBet}">
        <button class="btn btn-sm bet-btn">Bet</button>
      </div>
      ${player.currentBet > 0 ? `
        <div class="current-bet">
          Current bet: <span class="bet-amount">${player.currentBet}</span> points
        </div>
        <div class="player-actions">
          <button class="btn btn-sm win-btn">Win</button>
          <button class="btn btn-sm lost-btn">Lost</button>
          <button class="btn btn-sm remove-btn">×</button>
        </div>
      ` : `
        <div class="player-actions" style="justify-content: flex-end;">
          <button class="btn btn-sm remove-btn">×</button>
        </div>
      `}
    `;

    playersContainer.appendChild(playerCard);

    // Add event listeners
    const betInput = playerCard.querySelector('.bet-input');
    const betBtn = playerCard.querySelector('.bet-btn');
    const winBtn = playerCard.querySelector('.win-btn');
    const lostBtn = playerCard.querySelector('.lost-btn');
    const removeBtn = playerCard.querySelector('.remove-btn');

    betBtn.addEventListener('click', () => {
      const bet = parseInt(betInput.value) || 0;
      if (bet > player.points) {
        showToast('Cannot bet more than available points');
        return;
      }
      updatePlayerBet(player.id, bet);
    });

    if (winBtn) {
      winBtn.addEventListener('click', () => {
        declareWinner(player.id);
      });
    }

    if (lostBtn) {
      lostBtn.addEventListener('click', () => {
        declarePlayerLost(player.id);
      });
    }

    removeBtn.addEventListener('click', () => {
      if (confirm(`Are you sure you want to remove ${player.name} from the game?`)) {
        removePlayer(player.id);
      }
    });
  });
}

// Render loans
function renderLoans() {
  const allPlayers = [dealer, ...players];
  
  // Get all loans across all players
  const allLoans = allPlayers.flatMap(player => 
    player.loans.map(loan => ({
      ...loan,
      fromName: allPlayers.find(p => p.id === loan.from)?.name || 'Unknown',
      toName: allPlayers.find(p => p.id === loan.to)?.name || 'Unknown'
    }))
  );
  
  // Filter out duplicate loans
  const uniqueLoans = allLoans.filter((loan, index, self) => 
    index === self.findIndex(l => l.id === loan.id)
  );
  
  const activeLoans = uniqueLoans.filter(loan => !loan.paid);
  const paidLoans = uniqueLoans.filter(loan => loan.paid);
  
  // Render active loans
  activeLoansContainer.innerHTML = '';
  
  if (activeLoans.length === 0) {
    activeLoansContainer.innerHTML = '<p class="no-loans-message">No active loans</p>';
  } else {
    activeLoans.forEach(loan => {
      const isOverdue = loan.dueRound < roundCounter;
      const loanCard = document.createElement('div');
      loanCard.className = `loan-card ${isOverdue ? 'overdue' : ''}`;
      loanCard.dataset.id = loan.id;
      
      loanCard.innerHTML = `
        <div class="loan-header">
          <div class="loan-parties">
            <span>${loan.fromName}</span>
            <span>→</span>
            <span>${loan.toName}</span>
          </div>
          <div class="loan-amount">${loan.amount} pts</div>
        </div>
        <div class="loan-details">
          <div>${loan.interest}% interest</div>
          <div>
            Due: Round ${loan.dueRound}
            ${isOverdue ? '<span class="overdue-badge">Overdue</span>' : ''}
          </div>
        </div>
        <div class="loan-footer">
          <div class="repay-amount">
            Repay: <strong>${calculateTotalWithInterest(loan.amount, loan.interest)}</strong> pts
          </div>
          <button class="btn btn-sm repay-btn">Repay Loan</button>
        </div>
      `;
      
      activeLoansContainer.appendChild(loanCard);
      
      // Add event listener for repay button
      const repayBtn = loanCard.querySelector('.repay-btn');
      repayBtn.addEventListener('click', () => {
        repayLoan(loan.id, loan.to, loan.from, calculateTotalWithInterest(loan.amount, loan.interest));
      });
    });
  }
  
  // Render paid loans
  paidLoansContainer.innerHTML = '';
  
  if (paidLoans.length === 0) {
    paidLoansContainer.innerHTML = '<p class="no-loans-message">No paid loans</p>';
  } else {
    paidLoans.forEach(loan => {
      const loanCard = document.createElement('div');
      loanCard.className = 'loan-card paid';
      loanCard.dataset.id = loan.id;
      
      loanCard.innerHTML = `
        <div class="loan-header">
          <div class="loan-parties">
            <span>${loan.fromName}</span>
            <span>→</span>
            <span>${loan.toName}</span>
          </div>
          <div class="loan-amount">${loan.amount} pts</div>
        </div>
        <div class="loan-details">
          <div>${loan.interest}% interest</div>
          <div>Due: Round ${loan.dueRound}</div>
        </div>
        <div class="loan-footer">
          <div class="repay-amount">
            Repaid: <strong>${calculateTotalWithInterest(loan.amount, loan.interest)}</strong> pts
          </div>
          <span class="paid-badge">Paid</span>
        </div>
      `;
      
      paidLoansContainer.appendChild(loanCard);
    });
  }
  
  // Update loan modal dropdowns
  updateLoanModalDropdowns();
}

// Render game history
function renderHistory() {
  historyContainer.innerHTML = '';
  
  if (gameHistory.length === 0) {
    historyContainer.innerHTML = '<p class="no-history-message">No games played yet</p>';
    return;
  }
  
  gameHistory.forEach(game => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    
    const timestamp = new Date(game.timestamp);
    const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    historyItem.innerHTML = `
      <div class="history-header">
        <span class="winner">${game.winner} won</span>
        <span class="history-time">${timeString}</span>
      </div>
      <div class="history-amount">Amount: ${game.amount} points</div>
      <div class="history-losers">Loser: ${game.loser}</div>
    `;
    
    historyContainer.appendChild(historyItem);
  });
}

// Add a new player
function addPlayer(name, points) {
  if (!name.trim()) {
    showToast('Player name cannot be empty');
    return;
  }
  
  const newPlayer = {
    id: Date.now().toString(),
    name: name,
    points: points,
    currentBet: 0,
    loans: []
  };
  
  players.push(newPlayer);
  saveGameState();
  renderPlayers();
  updateLoanModalDropdowns();
  
  showToast(`${name} has joined the game with ${points} points`);
}

// Update player bet
function updatePlayerBet(playerId, bet) {
  players = players.map(player => 
    player.id === playerId 
      ? { ...player, currentBet: bet } 
      : player
  );
  
  saveGameState();
  renderPlayers();
  
  showToast(`Bet updated to ${bet} points`);
}

// Declare a winner (player wins against dealer)
function declareWinner(playerId) {
  // Find the winning player
  const player = players.find(p => p.id === playerId);
  
  if (!player || player.currentBet <= 0) return;
  
  // Player wins their bet from the dealer
  const winAmount = player.currentBet;
  
  // Update player's points - they keep their bet and win the same amount from dealer
  players = players.map(p => 
    p.id === playerId 
      ? { ...p, points: p.points + winAmount, currentBet: 0 } 
      : p
  );
  
  // Update dealer's points - dealer loses the bet amount
  dealer = {
    ...dealer,
    points: dealer.points - winAmount
  };
  
  // Add to game history
  const newHistory = {
    id: Date.now().toString(),
    timestamp: new Date(),
    winner: player.name,
    loser: 'Dealer',
    amount: winAmount
  };
  
  gameHistory.unshift(newHistory);
  
  saveGameState();
  renderPlayers();
  renderHistory();
  
  showToast(`${player.name} won ${winAmount} points from the dealer!`);
}

// Declare dealer as winner
function declareDealerWinner() {
  // Get all players with active bets
  const playersWithBets = players.filter(p => p.currentBet > 0);
  
  if (playersWithBets.length === 0) {
    showToast('No active bets to collect');
    return;
  }
  
  // Calculate total bet amount from all players
  const totalBet = playersWithBets.reduce((sum, player) => sum + player.currentBet, 0);
  
  // Update dealer's points - dealer wins all bets
  dealer = {
    ...dealer,
    points: dealer.points + totalBet
  };
  
  // Update players' points - they lose their bets
  players = players.map(player => 
    player.currentBet > 0
      ? { ...player, points: player.points - player.currentBet, currentBet: 0 } 
      : player
  );
  
  // Add to game history
  const newHistory = {
    id: Date.now().toString(),
    timestamp: new Date(),
    winner: 'Dealer',
    loser: playersWithBets.map(p => p.name).join(', '),
    amount: totalBet
  };
  
  gameHistory.unshift(newHistory);
  
  saveGameState();
  renderPlayers();
  renderHistory();
  
  showToast(`Dealer won ${totalBet} points!`);
}

// Declare a player lost to the dealer
function declarePlayerLost(playerId) {
  const player = players.find(p => p.id === playerId);
  if (!player || player.currentBet <= 0) return;
  
  // Player loses their bet to the dealer
  const lostAmount = player.currentBet;
  
  // Update dealer's points - dealer wins the bet
  dealer = {
    ...dealer,
    points: dealer.points + lostAmount
  };
  
  // Update player's points and reset bet
  players = players.map(p => 
    p.id === playerId 
      ? { ...p, points: p.points - lostAmount, currentBet: 0 } 
      : p
  );
  
  // Add to game history
  const newHistory = {
    id: Date.now().toString(),
    timestamp: new Date(),
    winner: 'Dealer',
    loser: player.name,
    amount: lostAmount
  };
  
  gameHistory.unshift(newHistory);
  
  saveGameState();
  renderPlayers();
  renderHistory();
  
  showToast(`${player.name} lost ${lostAmount} points to the dealer`);
}

// Reset game (bets only)
function resetGame() {
  players = players.map(player => ({ ...player, currentBet: 0 }));
  
  saveGameState();
  renderPlayers();
  
  showToast('All bets have been reset');
}

// Remove a player
function removePlayer(playerId) {
  players = players.filter(player => player.id !== playerId);
  
  saveGameState();
  renderPlayers();
  updateLoanModalDropdowns();
  
  showToast('Player has been removed from the game');
}

// Create a loan
function createLoan(from, to, amount, interest, dueInRounds) {
  if (!from || !to || from === to) {
    showToast('Please select different lender and borrower');
    return;
  }
  
  const allPlayers = [dealer, ...players];
  const fromPlayer = allPlayers.find(p => p.id === from);
  
  if (!fromPlayer || fromPlayer.points < amount) {
    showToast('Lender does not have enough points');
    return;
  }
  
  const newLoan = {
    id: Date.now().toString(),
    amount,
    interest,
    dueInRounds,
    dueRound: roundCounter + dueInRounds,
    from,
    to,
    paid: false,
    autoPaymentAttempted: false
  };
  
  // Update lender's points
  if (from === 'dealer') {
    dealer = {
      ...dealer,
      points: dealer.points - amount,
      loans: [...dealer.loans, newLoan]
    };
  } else {
    players = players.map(player => 
      player.id === from 
        ? { 
            ...player, 
            points: player.points - amount,
            loans: [...player.loans, newLoan]
          } 
        : player
    );
  }
  
  // Update borrower's points
  if (to === 'dealer') {
    dealer = {
      ...dealer,
      points: dealer.points + amount,
      loans: [...dealer.loans, newLoan]
    };
  } else {
    players = players.map(player => 
      player.id === to 
        ? { 
            ...player, 
            points: player.points + amount,
            loans: [...player.loans, newLoan]
          } 
        : player
    );
  }
  
  saveGameState();
  renderPlayers();
  renderLoans();
  
  showToast(`Loan of ${amount} points created with ${interest}% interest, due in ${dueInRounds} rounds`);
}

// Repay a loan
function repayLoan(loanId, fromId, toId, amount) {
  // Update lender's points and loan status
  if (toId === 'dealer') {
    dealer = {
      ...dealer,
      points: dealer.points + amount,
      loans: dealer.loans.map(loan => 
        loan.id === loanId ? { ...loan, paid: true } : loan
      )
    };
  } else {
    players = players.map(player => 
      player.id === toId 
        ? { 
            ...player, 
            points: player.points + amount,
            loans: player.loans.map(loan => 
              loan.id === loanId ? { ...loan, paid: true } : loan
            )
          } 
        : player
    );
  }
  
  // Update borrower's points
  if (fromId === 'dealer') {
    dealer = {
      ...dealer,
      points: dealer.points - amount,
      loans: dealer.loans.map(loan => 
        loan.id === loanId ? { ...loan, paid: true } : loan
      )
    };
  } else {
    players = players.map(player => 
      player.id === fromId 
        ? { 
            ...player, 
            points: player.points - amount,
            loans: player.loans.map(loan => 
              loan.id === loanId ? { ...loan, paid: true } : loan
            )
          } 
        : player
    );
  }
  
  saveGameState();
  renderPlayers();
  renderLoans();
  
  showToast(`Loan has been repaid`);
}

// Calculate total with interest
function calculateTotalWithInterest(amount, interest) {
  return Math.round(amount + (amount * interest / 100));
}

// Update loan modal dropdowns
function updateLoanModalDropdowns() {
  const loanFromSelect = document.getElementById('loan-from');
  const loanToSelect = document.getElementById('loan-to');
  
  // Clear existing options
  loanFromSelect.innerHTML = '<option value="">Select lender</option>';
  loanToSelect.innerHTML = '<option value="">Select borrower</option>';
  
  // Add dealer option
  const dealerOptionFrom = document.createElement('option');
  dealerOptionFrom.value = dealer.id;
  dealerOptionFrom.textContent = `${dealer.name} (${dealer.points} pts)`;
  loanFromSelect.appendChild(dealerOptionFrom);
  
  const dealerOptionTo = document.createElement('option');
  dealerOptionTo.value = dealer.id;
  dealerOptionTo.textContent = `${dealer.name} (${dealer.points} pts)`;
  loanToSelect.appendChild(dealerOptionTo);
  
  // Add player options
  players.forEach(player => {
    const playerOptionFrom = document.createElement('option');
    playerOptionFrom.value = player.id;
    playerOptionFrom.textContent = `${player.name} (${player.points} pts)`;
    loanFromSelect.appendChild(playerOptionFrom);
    
    const playerOptionTo = document.createElement('option');
    playerOptionTo.value = player.id;
    playerOptionTo.textContent = `${player.name} (${player.points} pts)`;
    loanToSelect.appendChild(playerOptionTo);
  });
}

// Show toast notification
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Increment round and check for auto loan repayments
function incrementRound() {
  roundCounter++;
  updateRoundCounter();
  
  // Check for loans that need to be auto-repaid
  checkLoansForAutoRepayment();
  
  saveGameState();
  showToast(`Round ${roundCounter} started`);
}

// Check for loans that need to be auto-repaid
function checkLoansForAutoRepayment() {
  const allPlayers = [dealer, ...players];
  let autoRepaidLoans = 0;
  
  // Get all active loans
  const allLoans = [];
  
  // Collect all loans from dealer
  dealer.loans.forEach(loan => {
    if (!loan.paid) {
      allLoans.push({...loan, playerType: 'dealer'});
    }
  });
  
  // Collect all loans from players
  players.forEach(player => {
    player.loans.forEach(loan => {
      if (!loan.paid) {
        allLoans.push({...loan, playerType: 'player', playerId: player.id});
      }
    });
  });
  
  // Check each loan
  allLoans.forEach(loan => {
    // Only process loans that are due exactly in this round and haven't been auto-payment attempted
    if (loan.dueRound === roundCounter && !loan.autoPaymentAttempted) {
      // Find borrower
      const borrower = loan.to === 'dealer' 
        ? dealer 
        : players.find(p => p.id === loan.to);
      
      if (!borrower) return;
      
      // Calculate repayment amount
      const repayAmount = calculateTotalWithInterest(loan.amount, loan.interest);
      
      // Check if borrower has enough points
      if (borrower.points >= repayAmount) {
        // Auto-repay the loan
        repayLoan(loan.id, loan.to, loan.from, repayAmount);
        autoRepaidLoans++;
      } else {
        // Mark the loan as auto-payment attempted
        if (loan.to === 'dealer') {
          dealer.loans = dealer.loans.map(l => 
            l.id === loan.id ? { ...l, autoPaymentAttempted: true } : l
          );
        } else {
          players = players.map(player => 
            player.id === loan.to 
              ? { 
                  ...player, 
                  loans: player.loans.map(l => 
                    l.id === loan.id ? { ...l, autoPaymentAttempted: true } : l
                  )
                } 
              : player
          );
        }
        
        // Also mark the loan as auto-payment attempted in the lender's records
        if (loan.from === 'dealer') {
          dealer.loans = dealer.loans.map(l => 
            l.id === loan.id ? { ...l, autoPaymentAttempted: true } : l
          );
        } else {
          players = players.map(player => 
            player.id === loan.from 
              ? { 
                  ...player, 
                  loans: player.loans.map(l => 
                    l.id === loan.id ? { ...l, autoPaymentAttempted: true } : l
                  )
                } 
              : player
          );
        }
      }
    }
  });
  
  if (autoRepaidLoans > 0) {
    showToast(`${autoRepaidLoans} loan(s) automatically repaid`);
  }
  
  saveGameState();
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(button => {
  button.addEventListener('click', () => {
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    
    // Add active class to clicked tab
    button.classList.add('active');
    const tabId = `${button.dataset.tab}-tab`;
    document.getElementById(tabId).classList.add('active');
  });
});

// Loan tab switching
document.querySelectorAll('.loan-tab-btn').forEach(button => {
  button.addEventListener('click', () => {
    // Remove active class from all loan tabs
    document.querySelectorAll('.loan-tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelectorAll('.loan-tab-content').forEach(content => {
      content.classList.remove('active');
    });
    
    // Add active class to clicked loan tab
    button.classList.add('active');
    const tabId = `${button.dataset.loanTab}-loans`;
    document.getElementById(tabId).classList.add('active');
  });
});

// Add Player Modal
document.querySelector('.add-player-btn').addEventListener('click', () => {
  addPlayerModal.style.display = 'block';
});

// Create Loan Modal
document.querySelector('.create-loan-btn').addEventListener('click', () => {
  createLoanModal.style.display = 'block';
  updateLoanModalDropdowns();
});

// Close modals
document.querySelectorAll('.close-modal').forEach(closeBtn => {
  closeBtn.addEventListener('click', () => {
    addPlayerModal.style.display = 'none';
    createLoanModal.style.display = 'none';
  });
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
  if (event.target === addPlayerModal) {
    addPlayerModal.style.display = 'none';
  }
  if (event.target === createLoanModal) {
    createLoanModal.style.display = 'none';
  }
});

// Add Player Form Submit
document.getElementById('confirm-add-player').addEventListener('click', () => {
  const nameInput = document.getElementById('player-name');
  const pointsInput = document.getElementById('player-points');
  
  const name = nameInput.value;
  const points = parseInt(pointsInput.value) || 100;
  
  addPlayer(name, points);
  
  // Reset form and close modal
  nameInput.value = '';
  pointsInput.value = '100';
  addPlayerModal.style.display = 'none';
});

// Create Loan Form Submit
document.getElementById('confirm-create-loan').addEventListener('click', () => {
  const fromSelect = document.getElementById('loan-from');
  const toSelect = document.getElementById('loan-to');
  const amountInput = document.getElementById('loan-amount');
  const interestInput = document.getElementById('interest-rate');
  const dueInRoundsInput = document.getElementById('due-in-rounds');
  
  const from = fromSelect.value;
  const to = toSelect.value;
  const amount = parseInt(amountInput.value) || 50;
  const interest = parseInt(interestInput.value) || 10;
  const dueInRounds = parseInt(dueInRoundsInput.value) || 5;
  
  createLoan(from, to, amount, interest, dueInRounds);
  
  // Reset form and close modal
  fromSelect.value = '';
  toSelect.value = '';
  amountInput.value = '50';
  interestInput.value = '10';
  dueInRoundsInput.value = '5';
  createLoanModal.style.display = 'none';
});

// Update loan summary when inputs change
document.getElementById('loan-from').addEventListener('change', updateLoanSummary);
document.getElementById('loan-to').addEventListener('change', updateLoanSummary);
document.getElementById('loan-amount').addEventListener('input', updateLoanSummary);
document.getElementById('interest-rate').addEventListener('input', updateLoanSummary);

function updateLoanSummary() {
  const from = document.getElementById('loan-from').value;
  const to = document.getElementById('loan-to').value;
  const amount = parseInt(document.getElementById('loan-amount').value) || 0;
  const interest = parseInt(document.getElementById('interest-rate').value) || 0;
  
  const loanSummary = document.getElementById('loan-summary');
  const totalRepay = document.getElementById('total-repay');
  
  if (from && to && from !== to && amount > 0) {
    totalRepay.textContent = calculateTotalWithInterest(amount, interest);
    loanSummary.classList.remove('hidden');
  } else {
    loanSummary.classList.add('hidden');
  }
}

// Add event listener for the Next Round button
// document.querySelector('.next-round-btn').addEventListener('click', () => {
//   incrementRound();
// });

// Game Controls
document.querySelector('.dealer-win-btn').addEventListener('click', () => {
  declareDealerWinner();
});

document.querySelector('.reset-btn').addEventListener('click', () => {
  resetGame();
});

document.getElementById('increment-round').addEventListener('click', () => {
  incrementRound();
});

document.getElementById('reset-stats').addEventListener('click', () => {
  resetGame();
});

// Initialize the game
initGame();