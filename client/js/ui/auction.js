/**
 * Auction Component
 * Handles property auction interface
 */

class Auction {
    constructor(socketClient, gameState) {
        this.socket = socketClient;
        this.gameState = gameState;
        this.activeAuction = null;
        this.timerInterval = null;
        
        this.createAuctionModal();
        this.initialize();
    }

    /**
     * Create auction modal dynamically
     */
    createAuctionModal() {
        const modalHTML = `
            <div id="auction-modal" class="fixed inset-0 bg-gray-800 bg-opacity-90 modal-overlay flex items-center justify-center z-50 hidden">
                <div class="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6">
                    <div class="text-center mb-6">
                        <h2 class="text-3xl font-bold mb-2">🔨 Property Auction</h2>
                        <p id="auction-property-name" class="text-xl text-gray-700">Property Name</p>
                    </div>
                    
                    <!-- Property Details -->
                    <div id="auction-property-details" class="bg-gray-50 rounded p-4 mb-4">
                        <!-- Property info will be inserted here -->
                    </div>
                    
                    <!-- Current Bid Display -->
                    <div class="bg-blue-50 border-2 border-blue-500 rounded-lg p-4 mb-4 text-center">
                        <div class="text-sm text-gray-600 mb-1">Current Highest Bid</div>
                        <div id="auction-current-bid" class="text-4xl font-bold text-blue-600 mb-1">৳0</div>
                        <div id="auction-current-bidder" class="text-sm text-gray-600">No bids yet</div>
                    </div>
                    
                    <!-- Timer -->
                    <div class="text-center mb-4">
                        <div class="text-sm text-gray-600 mb-1">Time Remaining</div>
                        <div id="auction-timer" class="text-3xl font-bold text-red-600">30s</div>
                    </div>
                    
                    <!-- Bid Controls -->
                    <div id="auction-bid-controls" class="mb-4">
                        <div class="flex gap-2 mb-3">
                            <button class="bid-increment flex-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 rounded" data-amount="10">
                                +৳10
                            </button>
                            <button class="bid-increment flex-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 rounded" data-amount="50">
                                +৳50
                            </button>
                            <button class="bid-increment flex-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 rounded" data-amount="100">
                                +৳100
                            </button>
                            <button class="bid-increment flex-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 rounded" data-amount="500">
                                +৳500
                            </button>
                        </div>
                        
                        <div class="flex gap-2">
                            <input type="number" id="auction-bid-input" min="0" step="10" 
                                class="flex-1 border-2 border-gray-300 rounded px-4 py-2 text-lg text-center" 
                                placeholder="Enter bid amount">
                            <button id="auction-place-bid-btn" class="bg-green-500 hover:bg-green-700 text-white font-bold px-6 py-2 rounded">
                                Place Bid
                            </button>
                        </div>
                        
                        <button id="auction-pass-btn" class="w-full mt-2 bg-gray-400 hover:bg-gray-600 text-white font-bold py-2 rounded">
                            Pass
                        </button>
                    </div>
                    
                    <!-- Bid History -->
                    <div class="mt-4">
                        <h3 class="font-bold mb-2">Bid History</h3>
                        <div id="auction-bid-history" class="max-h-32 overflow-y-auto bg-gray-50 rounded p-2">
                            <p class="text-gray-500 text-sm text-center">No bids yet</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Initialize auction system
     */
    initialize() {
        // Get modal elements
        this.auctionModal = document.getElementById('auction-modal');
        this.propertyNameEl = document.getElementById('auction-property-name');
        this.propertyDetailsEl = document.getElementById('auction-property-details');
        this.currentBidEl = document.getElementById('auction-current-bid');
        this.currentBidderEl = document.getElementById('auction-current-bidder');
        this.timerEl = document.getElementById('auction-timer');
        this.bidInputEl = document.getElementById('auction-bid-input');
        this.bidHistoryEl = document.getElementById('auction-bid-history');
        this.placeBidBtn = document.getElementById('auction-place-bid-btn');
        this.passBtn = document.getElementById('auction-pass-btn');
        
        this.setupEventListeners();
        this.setupSocketListeners();
    }

    /**
     * Setup UI event listeners
     */
    setupEventListeners() {
        // Bid increment buttons
        document.querySelectorAll('.bid-increment').forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = parseInt(btn.dataset.amount);
                const currentValue = parseInt(this.bidInputEl.value) || 0;
                const currentBid = this.activeAuction ? this.activeAuction.currentBid : 0;
                this.bidInputEl.value = Math.max(currentValue, currentBid) + amount;
            });
        });
        
        // Place bid button
        this.placeBidBtn.addEventListener('click', () => this.placeBid());
        
        // Pass button
        this.passBtn.addEventListener('click', () => this.pass());
        
        // Enter key to place bid
        this.bidInputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.placeBid();
            }
        });
    }

    /**
     * Setup socket event listeners
     */
    setupSocketListeners() {
        this.socket.on('auction-started', (data) => {
            this.showAuction(data);
        });
        
        this.socket.on('bid-placed', (data) => {
            this.updateBid(data);
        });
        
        this.socket.on('auction-ended', (data) => {
            this.endAuction(data);
        });
    }

    /**
     * Show auction modal
     */
    showAuction(data) {
        this.activeAuction = data.auction;
        const property = data.property;
        
        // Set property name
        this.propertyNameEl.textContent = property.name;
        
        // Set property details
        this.propertyDetailsEl.innerHTML = this.formatPropertyDetails(property);
        
        // Reset bid display
        this.currentBidEl.textContent = '৳0';
        this.currentBidderEl.textContent = 'No bids yet';
        this.bidInputEl.value = '';
        this.bidHistoryEl.innerHTML = '<p class="text-gray-500 text-sm text-center">No bids yet</p>';
        
        // Show modal
        this.auctionModal.classList.remove('hidden');
        
        // Start timer
        this.startTimer();
        
        // Focus on bid input
        this.bidInputEl.focus();
        
        this.showToast('Auction started! Place your bid.', 'info');
    }

    /**
     * Format property details
     */
    formatPropertyDetails(property) {
        if (property.type === 'property') {
            return `
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>List Price:</strong> ৳${property.price}</div>
                    <div><strong>Group:</strong> <span class="px-2 py-1 rounded ${property.color} text-white text-xs">${property.group}</span></div>
                    <div><strong>Base Rent:</strong> ৳${property.rent[0]}</div>
                    <div><strong>Building Cost:</strong> ৳${property.buildCost}</div>
                </div>
            `;
        } else if (property.type === 'station') {
            return `
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>List Price:</strong> ৳${property.price}</div>
                    <div><strong>Type:</strong> Station</div>
                    <div><strong>Base Rent:</strong> ৳${property.rent[0]}</div>
                </div>
            `;
        } else if (property.type === 'utility') {
            return `
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>List Price:</strong> ৳${property.price}</div>
                    <div><strong>Type:</strong> Utility</div>
                    <div><strong>Rent:</strong> 4x or 10x dice roll</div>
                </div>
            `;
        }
        return '';
    }

    /**
     * Start auction timer
     */
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            if (!this.activeAuction) {
                clearInterval(this.timerInterval);
                return;
            }
            
            const remaining = Math.max(0, Math.ceil((this.activeAuction.endTime - Date.now()) / 1000));
            this.timerEl.textContent = `${remaining}s`;
            
            // Change color based on time remaining
            if (remaining <= 5) {
                this.timerEl.classList.add('text-red-600', 'animate-pulse');
            } else if (remaining <= 10) {
                this.timerEl.classList.add('text-orange-600');
            }
            
            if (remaining <= 0) {
                clearInterval(this.timerInterval);
                // Auto-end auction (server should handle this, but as fallback)
                setTimeout(() => {
                    if (this.activeAuction && this.activeAuction.isActive) {
                        this.socket.emit('end-auction', {});
                    }
                }, 1000);
            }
        }, 100);
    }

    /**
     * Update bid display
     */
    updateBid(data) {
        if (!this.activeAuction) return;
        
        this.activeAuction = data.auction;
        
        // Update display
        this.currentBidEl.textContent = `৳${data.amount.toLocaleString()}`;
        this.currentBidderEl.textContent = `by ${data.playerName}`;
        
        // Add to history
        const historyItem = document.createElement('div');
        historyItem.className = 'text-sm py-1 border-b border-gray-200';
        historyItem.innerHTML = `
            <strong>${data.playerName}:</strong> ৳${data.amount.toLocaleString()}
            <span class="text-gray-500 text-xs float-right">${new Date().toLocaleTimeString()}</span>
        `;
        
        if (this.bidHistoryEl.querySelector('.text-center')) {
            this.bidHistoryEl.innerHTML = '';
        }
        this.bidHistoryEl.insertBefore(historyItem, this.bidHistoryEl.firstChild);
        
        // Clear input
        this.bidInputEl.value = '';
        
        // Update game state if provided
        if (data.gameState) {
            this.gameState = data.gameState;
        }
    }

    /**
     * Place a bid
     */
    placeBid() {
        const amount = parseInt(this.bidInputEl.value);
        
        if (!amount || amount <= 0) {
            this.showToast('Please enter a valid bid amount', 'warning');
            return;
        }
        
        if (!this.activeAuction) {
            this.showToast('No active auction', 'error');
            return;
        }
        
        if (amount <= this.activeAuction.currentBid) {
            this.showToast(`Bid must be higher than ৳${this.activeAuction.currentBid}`, 'warning');
            return;
        }
        
        // Check if player has enough money
        const currentPlayer = this.getCurrentPlayer();
        if (currentPlayer && amount > currentPlayer.money) {
            this.showToast('Insufficient funds', 'error');
            return;
        }
        
        // Send bid to server
        this.socket.emit('place-bid', { amount });
    }

    /**
     * Pass on auction
     */
    pass() {
        // Just close the modal for this player
        this.showToast('You passed on this auction', 'info');
        // Don't actually close modal, let them watch
    }

    /**
     * End auction
     */
    endAuction(data) {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        const result = data.result;
        
        // Show winner announcement
        if (result.currentBidder && result.currentBid > 0) {
            const winner = this.getPlayerName(result.currentBidder);
            const property = this.gameState.board[result.propertyIndex];
            
            this.showWinnerAnnouncement(winner, property, result.currentBid);
        } else {
            this.showToast('No bids placed. Property remains unowned.', 'info');
        }
        
        // Update game state
        if (data.gameState) {
            this.gameState = data.gameState;
        }
        
        // Close modal after a delay
        setTimeout(() => {
            this.auctionModal.classList.add('hidden');
            this.activeAuction = null;
        }, 3000);
    }

    /**
     * Show winner announcement
     */
    showWinnerAnnouncement(winner, property, amount) {
        // Create announcement overlay
        const announcement = document.createElement('div');
        announcement.className = 'absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center rounded-lg';
        announcement.innerHTML = `
            <div class="text-center">
                <div class="text-6xl mb-4">🎉</div>
                <h3 class="text-2xl font-bold mb-2">Auction Won!</h3>
                <p class="text-xl mb-1">${winner}</p>
                <p class="text-gray-600">won <strong>${property.name}</strong></p>
                <p class="text-lg text-green-600 font-bold mt-2">for ৳${amount.toLocaleString()}</p>
            </div>
        `;
        
        this.auctionModal.querySelector('.bg-white').appendChild(announcement);
        
        // Confetti effect
        if (window.Animations) {
            const animations = new window.Animations();
            for (let i = 0; i < 20; i++) {
                setTimeout(() => animations.createConfetti(), i * 50);
            }
        }
    }

    /**
     * Get current player
     */
    getCurrentPlayer() {
        if (!this.gameState || !this.gameState.players) return null;
        const playerId = this.socket.getCurrentPlayerId();
        return this.gameState.players.find(p => p.id === playerId);
    }

    /**
     * Get player name
     */
    getPlayerName(playerId) {
        if (!this.gameState || !this.gameState.players) return 'Unknown';
        const player = this.gameState.players.find(p => p.id === playerId);
        return player ? player.name : 'Unknown';
    }

    /**
     * Update game state
     */
    updateGameState(gameState) {
        this.gameState = gameState;
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        if (window.Animations) {
            const animations = new window.Animations();
            animations.showToast(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }
}

// Make Auction available globally
if (typeof window !== 'undefined') {
    window.Auction = Auction;
}
