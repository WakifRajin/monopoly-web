/**
 * Trade Component
 * Handles trading interface and trade management
 */

class Trade {
    constructor(socketClient, gameState) {
        this.socket = socketClient;
        this.gameState = gameState;
        this.currentTrade = null;
        this.selectedProperties = {
            offering: [],
            requesting: []
        };
        this.offeredMoney = 0;
        this.requestedMoney = 0;
        
        this.createTradeModal();
        this.initialize();
    }

    /**
     * Create trade modal dynamically
     */
    createTradeModal() {
        const modalHTML = `
            <div id="trade-modal" class="fixed inset-0 bg-gray-800 bg-opacity-75 modal-overlay flex items-center justify-center z-50 hidden">
                <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold">Trade Proposal</h2>
                        <button id="close-trade-modal" class="text-gray-500 hover:text-gray-700">
                            <span class="text-2xl">&times;</span>
                        </button>
                    </div>
                    
                    <!-- Select Player -->
                    <div class="mb-4">
                        <label class="block text-sm font-semibold mb-2">Trade with:</label>
                        <select id="trade-opponent-select" class="w-full border border-gray-300 rounded px-3 py-2">
                            <option value="">Select a player...</option>
                        </select>
                    </div>
                    
                    <!-- Trade Content -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- You Offer -->
                        <div class="border rounded p-4">
                            <h3 class="font-bold mb-3 text-lg">You Offer</h3>
                            
                            <!-- Money Input -->
                            <div class="mb-3">
                                <label class="block text-sm font-semibold mb-1">Money:</label>
                                <input type="number" id="trade-offer-money" min="0" step="100" value="0" 
                                    class="w-full border border-gray-300 rounded px-3 py-2">
                            </div>
                            
                            <!-- Properties -->
                            <div>
                                <label class="block text-sm font-semibold mb-2">Properties:</label>
                                <div id="trade-offer-properties" class="space-y-1 max-h-64 overflow-y-auto">
                                    <!-- Properties will be listed here -->
                                </div>
                            </div>
                        </div>
                        
                        <!-- You Request -->
                        <div class="border rounded p-4">
                            <h3 class="font-bold mb-3 text-lg">You Request</h3>
                            
                            <!-- Money Input -->
                            <div class="mb-3">
                                <label class="block text-sm font-semibold mb-1">Money:</label>
                                <input type="number" id="trade-request-money" min="0" step="100" value="0" 
                                    class="w-full border border-gray-300 rounded px-3 py-2">
                            </div>
                            
                            <!-- Properties -->
                            <div>
                                <label class="block text-sm font-semibold mb-2">Properties:</label>
                                <div id="trade-request-properties" class="space-y-1 max-h-64 overflow-y-auto">
                                    <!-- Properties will be listed here -->
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Trade Actions -->
                    <div class="mt-6 flex gap-2 justify-end">
                        <button id="trade-propose-btn" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded">
                            Propose Trade
                        </button>
                        <button id="trade-cancel-btn" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Incoming Trade Modal -->
            <div id="incoming-trade-modal" class="fixed inset-0 bg-gray-800 bg-opacity-75 modal-overlay flex items-center justify-center z-50 hidden">
                <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
                    <h2 class="text-2xl font-bold mb-4">Trade Offer Received</h2>
                    <p id="trade-from-player" class="mb-4 text-lg"></p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <!-- They Offer -->
                        <div class="border rounded p-4">
                            <h3 class="font-bold mb-2">They Offer:</h3>
                            <div id="incoming-trade-offer" class="text-sm space-y-1">
                                <!-- Trade offer details -->
                            </div>
                        </div>
                        
                        <!-- They Request -->
                        <div class="border rounded p-4">
                            <h3 class="font-bold mb-2">They Request:</h3>
                            <div id="incoming-trade-request" class="text-sm space-y-1">
                                <!-- Trade request details -->
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex gap-2 justify-end">
                        <button id="trade-accept-btn" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded">
                            Accept
                        </button>
                        <button id="trade-reject-btn" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-6 rounded">
                            Reject
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Initialize trade system
     */
    initialize() {
        // Get modal elements
        this.tradeModal = document.getElementById('trade-modal');
        this.incomingTradeModal = document.getElementById('incoming-trade-modal');
        
        this.opponentSelect = document.getElementById('trade-opponent-select');
        this.offerMoneyInput = document.getElementById('trade-offer-money');
        this.requestMoneyInput = document.getElementById('trade-request-money');
        this.offerPropertiesDiv = document.getElementById('trade-offer-properties');
        this.requestPropertiesDiv = document.getElementById('trade-request-properties');
        
        this.proposeBtnElement = document.getElementById('trade-propose-btn');
        this.cancelBtn = document.getElementById('trade-cancel-btn');
        this.closeBtn = document.getElementById('close-trade-modal');
        
        this.acceptBtn = document.getElementById('trade-accept-btn');
        this.rejectBtn = document.getElementById('trade-reject-btn');
        
        this.setupEventListeners();
        this.setupSocketListeners();
    }

    /**
     * Setup UI event listeners
     */
    setupEventListeners() {
        // Open trade modal
        const tradeBtn = document.getElementById('trade-btn');
        if (tradeBtn) {
            tradeBtn.addEventListener('click', () => this.showTradeModal());
        }
        
        // Close modals
        this.closeBtn.addEventListener('click', () => this.hideTradeModal());
        this.cancelBtn.addEventListener('click', () => this.hideTradeModal());
        
        // Opponent selection
        this.opponentSelect.addEventListener('change', () => this.updateOpponentProperties());
        
        // Propose trade
        this.proposeBtnElement.addEventListener('click', () => this.proposeTrade());
        
        // Accept/Reject trade
        this.acceptBtn.addEventListener('click', () => this.respondToTrade(true));
        this.rejectBtn.addEventListener('click', () => this.respondToTrade(false));
    }

    /**
     * Setup socket event listeners
     */
    setupSocketListeners() {
        this.socket.on('trade-offered', (data) => {
            this.showIncomingTrade(data);
        });
        
        this.socket.on('trade-accepted', (data) => {
            this.hideIncomingTradeModal();
            this.showToast('Trade accepted!', 'success');
        });
        
        this.socket.on('trade-rejected', (data) => {
            this.hideIncomingTradeModal();
            this.showToast('Trade rejected', 'info');
        });
    }

    /**
     * Show trade modal
     */
    showTradeModal() {
        if (!this.gameState) {
            this.showToast('Game state not available', 'error');
            return;
        }
        
        this.populateOpponentSelect();
        this.updateMyProperties();
        this.tradeModal.classList.remove('hidden');
    }

    /**
     * Hide trade modal
     */
    hideTradeModal() {
        this.tradeModal.classList.add('hidden');
        this.resetTrade();
    }

    /**
     * Hide incoming trade modal
     */
    hideIncomingTradeModal() {
        this.incomingTradeModal.classList.add('hidden');
    }

    /**
     * Populate opponent select dropdown
     */
    populateOpponentSelect() {
        const currentPlayerId = this.socket.getCurrentPlayerId();
        this.opponentSelect.innerHTML = '<option value="">Select a player...</option>';
        
        this.gameState.players.forEach(player => {
            if (player.id !== currentPlayerId && !player.isBankrupt) {
                const option = document.createElement('option');
                option.value = player.id;
                option.textContent = player.name;
                this.opponentSelect.appendChild(option);
            }
        });
    }

    /**
     * Update my properties list
     */
    updateMyProperties() {
        const currentPlayerId = this.socket.getCurrentPlayerId();
        const myPlayer = this.gameState.players.find(p => p.id === currentPlayerId);
        
        if (!myPlayer || !myPlayer.properties || myPlayer.properties.length === 0) {
            this.offerPropertiesDiv.innerHTML = '<p class="text-gray-500 text-sm">No properties to trade</p>';
            return;
        }
        
        this.offerPropertiesDiv.innerHTML = '';
        
        myPlayer.properties.forEach(propIndex => {
            const property = this.gameState.board[propIndex];
            if (property && property.type === 'property' || property.type === 'station' || property.type === 'utility') {
                const checkbox = this.createPropertyCheckbox(property, 'offer');
                this.offerPropertiesDiv.appendChild(checkbox);
            }
        });
    }

    /**
     * Update opponent properties list
     */
    updateOpponentProperties() {
        const opponentId = this.opponentSelect.value;
        
        if (!opponentId) {
            this.requestPropertiesDiv.innerHTML = '<p class="text-gray-500 text-sm">Select a player first</p>';
            return;
        }
        
        const opponent = this.gameState.players.find(p => p.id === opponentId);
        
        if (!opponent || !opponent.properties || opponent.properties.length === 0) {
            this.requestPropertiesDiv.innerHTML = '<p class="text-gray-500 text-sm">No properties available</p>';
            return;
        }
        
        this.requestPropertiesDiv.innerHTML = '';
        
        opponent.properties.forEach(propIndex => {
            const property = this.gameState.board[propIndex];
            if (property && (property.type === 'property' || property.type === 'station' || property.type === 'utility')) {
                const checkbox = this.createPropertyCheckbox(property, 'request');
                this.requestPropertiesDiv.appendChild(checkbox);
            }
        });
    }

    /**
     * Create property checkbox
     */
    createPropertyCheckbox(property, type) {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-2 p-2 hover:bg-gray-50 rounded';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `trade-${type}-${property.index}`;
        checkbox.value = property.index;
        checkbox.className = 'w-4 h-4';
        
        const label = document.createElement('label');
        label.htmlFor = `trade-${type}-${property.index}`;
        label.className = 'flex-1 text-sm cursor-pointer';
        label.textContent = `${property.name} (৳${property.price})`;
        
        div.appendChild(checkbox);
        div.appendChild(label);
        
        return div;
    }

    /**
     * Propose a trade
     */
    proposeTrade() {
        const opponentId = this.opponentSelect.value;
        
        if (!opponentId) {
            this.showToast('Please select a player to trade with', 'warning');
            return;
        }
        
        // Get selected properties
        const offeredProperties = Array.from(
            this.offerPropertiesDiv.querySelectorAll('input[type="checkbox"]:checked')
        ).map(cb => parseInt(cb.value));
        
        const requestedProperties = Array.from(
            this.requestPropertiesDiv.querySelectorAll('input[type="checkbox"]:checked')
        ).map(cb => parseInt(cb.value));
        
        const offeredMoney = parseInt(this.offerMoneyInput.value) || 0;
        const requestedMoney = parseInt(this.requestMoneyInput.value) || 0;
        
        // Validate trade
        if (offeredProperties.length === 0 && requestedProperties.length === 0 && 
            offeredMoney === 0 && requestedMoney === 0) {
            this.showToast('Please select at least one item to trade', 'warning');
            return;
        }
        
        // Send trade offer
        this.socket.emit('trade-offer', {
            toPlayerId: opponentId,
            offer: {
                offeredProperties,
                requestedProperties,
                offeredMoney,
                requestedMoney
            }
        });
        
        this.hideTradeModal();
        this.showToast('Trade offer sent!', 'success');
    }

    /**
     * Show incoming trade offer
     */
    showIncomingTrade(data) {
        this.currentTrade = data.trade;
        
        const fromPlayer = this.gameState.players.find(p => p.id === data.trade.fromPlayerId);
        document.getElementById('trade-from-player').textContent = 
            `Trade offer from ${fromPlayer ? fromPlayer.name : 'Unknown'}`;
        
        // Display offer
        const offerDiv = document.getElementById('incoming-trade-offer');
        offerDiv.innerHTML = this.formatTradeOffer(data.trade.offer.offeredProperties, data.trade.offer.offeredMoney);
        
        // Display request
        const requestDiv = document.getElementById('incoming-trade-request');
        requestDiv.innerHTML = this.formatTradeOffer(data.trade.offer.requestedProperties, data.trade.offer.requestedMoney);
        
        this.incomingTradeModal.classList.remove('hidden');
    }

    /**
     * Format trade offer for display
     */
    formatTradeOffer(properties, money) {
        let html = '';
        
        if (money > 0) {
            html += `<div class="font-semibold">৳${money.toLocaleString()}</div>`;
        }
        
        if (properties && properties.length > 0) {
            properties.forEach(propIndex => {
                const property = this.gameState.board[propIndex];
                if (property) {
                    html += `<div>${property.name}</div>`;
                }
            });
        }
        
        if (html === '') {
            html = '<div class="text-gray-500">Nothing</div>';
        }
        
        return html;
    }

    /**
     * Respond to trade offer
     */
    respondToTrade(accept) {
        if (!this.currentTrade) return;
        
        this.socket.emit('trade-response', {
            tradeId: this.currentTrade.id,
            accept: accept
        });
        
        this.hideIncomingTradeModal();
        this.currentTrade = null;
    }

    /**
     * Reset trade form
     */
    resetTrade() {
        this.opponentSelect.value = '';
        this.offerMoneyInput.value = '0';
        this.requestMoneyInput.value = '0';
        this.selectedProperties = { offering: [], requesting: [] };
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
            alert(message);
        }
    }
}

// Make Trade available globally
if (typeof window !== 'undefined') {
    window.Trade = Trade;
}
