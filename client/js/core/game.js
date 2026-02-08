/**
 * Game Class
 * Main game logic and state management
 */

// Constants
const UNMORTGAGE_INTEREST_RATE = 1.1; // 10% interest on unmortgage (110% of mortgage value)
const AUTO_TURN_END_DELAY_MS = 1500; // Delay before auto-ending turn on passive spaces

class Game {
    constructor(board, socketClient, chat = null) {
        this.board = board;
        this.socket = socketClient;
        this.chat = chat;
        this.gameState = null;
        this.currentPlayerId = null;
        this.roomCode = null;

        // DOM elements
        this.rollDiceBtn = document.getElementById('roll-dice-btn');
        this.endTurnBtn = document.getElementById('end-turn-btn');
        this.buyPropertyBtn = document.getElementById('buy-property-btn');
        this.buildBtn = document.getElementById('build-btn');
        this.mortgageBtn = document.getElementById('mortgage-btn');
        this.tradeBtn = document.getElementById('trade-btn');
        this.turnIndicator = document.getElementById('turn-indicator');
        this.playerInfoPanels = document.getElementById('player-info-panels');
        this.logScreen = document.getElementById('log-screen');
        this.dice1 = document.getElementById('dice1');
        this.dice2 = document.getElementById('dice2');
        this.connectionStatus = document.getElementById('connection-status');
        this.notificationModal = document.getElementById('notification-modal');
        this.notificationMessage = document.getElementById('notification-message');
        this.notificationButtons = document.getElementById('notification-buttons');
        this.closePropertyModal = document.getElementById('close-property-modal');

        // Stats tracking
        this.statsUI = null;
        
        this.initialize();
    }

    /**
     * Initialize stats tracking
     */
    initStats() {
        if (typeof StatsUI !== 'undefined' && window.statsUI) {
            this.statsUI = window.statsUI;
            this.statsUI.init();
            console.log('✓ Stats tracking initialized');
        }
    }

    /**
     * Track stats event
     */
    trackStats(eventType, data) {
        if (this.statsUI) {
            try {
                // Add current player ID to data if not present
                if (!data.playerId && this.currentPlayerId) {
                    data.playerId = this.currentPlayerId;
                }
                this.statsUI.updateStats(eventType, data);
            } catch (error) {
                console.error('Stats tracking error:', error);
            }
        }
    }

    /**
     * Initialize game
     */
    initialize() {
        this.setupEventListeners();
        this.setupSocketListeners();
        
        // Get room code and player ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.roomCode = urlParams.get('room');
        this.currentPlayerId = urlParams.get('playerId') || localStorage.getItem('currentPlayerId');

        if (this.roomCode) {
            this.log('Connecting to room...');
        }
        
        // Initialize stats after a short delay to ensure StatsUI is loaded
        setTimeout(() => this.initStats(), 100);
    }

    /**
     * Setup UI event listeners
     */
    setupEventListeners() {
        this.rollDiceBtn.addEventListener('click', () => this.handleRollDice());
        this.endTurnBtn.addEventListener('click', () => this.handleEndTurn());
        this.buyPropertyBtn.addEventListener('click', () => this.handleBuyProperty());
        this.buildBtn.addEventListener('click', () => this.showBuildMenu());
        this.mortgageBtn.addEventListener('click', () => this.showMortgageMenu());
        this.tradeBtn.addEventListener('click', () => this.showTradeMenu());
        this.closePropertyModal.addEventListener('click', () => {
            document.getElementById('property-modal').classList.add('hidden');
        });
    }

    /**
     * Setup socket event listeners
     */
    setupSocketListeners() {
        // Connection events
        this.socket.on('connection-changed', (data) => {
            this.updateConnectionStatus(data.state);
        });

        this.socket.on('error', (data) => {
            this.showNotification(data.message, [
                { text: 'OK', action: 'close' }
            ]);
        });

        // Room events
        this.socket.on('room-joined', (data) => {
            this.currentPlayerId = data.playerId;
            this.log(`Joined room: ${data.room.code}`);
        });

        this.socket.on('player-joined', (data) => {
            this.log(`${data.player.name} joined the game`);
            if (this.chat) {
                this.chat.displayNotification(`${data.player.name} joined the game`, 'join');
            }
        });

        this.socket.on('player-left', (data) => {
            this.log(`A player left the game`);
            if (this.chat) {
                this.chat.displayNotification('A player left the game', 'leave');
            }
        });

        // Game events
        this.socket.on('game-started', (data) => {
            console.log('🎮 Game started event received:', data);
            if (data && data.game) {
                this.initializeFromServer(data.game);
            } else {
                console.error('❌ game-started event missing game data');
            }
        });

        // Handle game state response (when requesting state on page load)
        this.socket.on('game-state', (data) => {
            console.log('📦 Game state event received:', data);
            if (data && data.game) {
                this.initializeFromServer(data.game);
            } else {
                console.error('❌ game-state event missing game data');
            }
        });

        this.socket.on('dice-rolled', (data) => {
            this.handleDiceRolled(data);
        });

        this.socket.on('property-bought', (data) => {
            this.handlePropertyBought(data);
        });

        this.socket.on('turn-changed', (data) => {
            this.handleTurnChanged(data);
        });

        this.socket.on('building-built', (data) => {
            this.handleBuildingBuilt(data);
        });

        this.socket.on('property-mortgaged', (data) => {
            this.handlePropertyMortgaged(data);
        });

        this.socket.on('property-unmortgaged', (data) => {
            this.handlePropertyUnmortgaged(data);
        });

        // Landing events
        this.socket.on('property-available', (data) => {
            this.handlePropertyAvailable(data);
        });

        this.socket.on('rent-paid', (data) => {
            this.handleRentPaid(data);
        });

        this.socket.on('card-drawn', (data) => {
            this.handleCardDrawn(data);
        });

        this.socket.on('tax-paid', (data) => {
            this.handleTaxPaid(data);
        });

        this.socket.on('go-to-jail', (data) => {
            this.handleGoToJail(data);
        });

        this.socket.on('free-parking-jackpot', (data) => {
            this.handleFreeParkingJackpot(data);
        });

        this.socket.on('suggest-turn-end', (data) => {
            this.handleSuggestTurnEnd(data);
        });

        this.socket.on('trade-offer-received', (data) => {
            this.handleTradeOfferReceived(data);
        });

        this.socket.on('trade-completed', (data) => {
            this.handleTradeCompleted(data);
        });
        
        // Auction events
        this.socket.on('auction-won', (data) => {
            if (data.winnerId === this.currentPlayerId) {
                this.trackStats('auction-won', {
                    playerId: data.winnerId,
                    amount: data.amount,
                    propertyName: data.propertyName
                });
            }
        });
        
        // Bankruptcy and game end
        this.socket.on('player-bankrupt', (data) => {
            this.handlePlayerBankrupt(data);
        });
        
        this.socket.on('game-ended', (data) => {
            this.handleGameEnded(data);
        });
    }

    /**
     * Update connection status indicator
     */
    updateConnectionStatus(state) {
        this.connectionStatus.className = `connection-status ${state}`;
        
        if (state === CONSTANTS.CONNECTION_STATES.CONNECTED) {
            this.connectionStatus.textContent = 'Connected';
        } else if (state === CONSTANTS.CONNECTION_STATES.DISCONNECTED) {
            this.connectionStatus.textContent = 'Disconnected';
        } else {
            this.connectionStatus.textContent = 'Connecting...';
        }
    }

    /**
     * Handle roll dice button click
     */
    handleRollDice() {
        this.socket.rollDice();
        this.rollDiceBtn.disabled = true;
    }

    /**
     * Handle dice rolled event
     */
    handleDiceRolled(data) {
        const { dice, playerId, newPosition, game } = data;
        
        // Update dice display
        this.dice1.dataset.value = dice[0];
        this.dice2.dataset.value = dice[1];
        
        const isDouble = dice[0] === dice[1];
        const total = dice[0] + dice[1];
        
        // Find player by ID
        const player = game.players.find(p => p.id === playerId);
        const playerName = player ? player.name : 'Player';
        
        this.log(`${playerName} rolled ${dice[0]} and ${dice[1]} (Total: ${total})${isDouble ? ' - DOUBLES!' : ''}`);
        
        // Update player position
        if (player) {
            this.board.updatePlayerPosition(player.id, newPosition, player.color, player.token);
        }
        this.board.highlightSpace(newPosition);
        
        // Update game state
        this.updateGameState(game);
    }

    /**
     * Handle buy property button click
     */
    handleBuyProperty() {
        this.socket.buyProperty();
        this.buyPropertyBtn.disabled = true;
    }

    /**
     * Handle property bought event
     */
    handlePropertyBought(data) {
        const { playerId, property, game } = data;
        
        // Find player by ID
        const player = game.players.find(p => p.id === playerId);
        const playerName = player ? player.name : 'Player';
        
        this.log(`${playerName} bought ${property.name} for ৳${property.price}`);
        
        // Update board display
        if (player) {
            this.board.updatePropertyOwnership(property.index, player.color);
        }
        
        // Update game state
        this.updateGameState(game);
        
        // Track stats
        this.trackStats('property-purchased', {
            playerId: playerId,
            price: property.price,
            propertyName: property.name
        });
    }

    /**
     * Handle end turn button click
     */
    handleEndTurn() {
        this.socket.endTurn();
        this.endTurnBtn.disabled = true;
    }

    /**
     * Handle turn changed event
     */
    handleTurnChanged(data) {
        const { game, currentPlayerId } = data;
        
        // Find current player
        const currentPlayer = game.players.find(p => p.id === currentPlayerId);
        const playerName = currentPlayer ? currentPlayer.name : 'Unknown';
        
        this.log(`${playerName}'s turn`);
        
        // Update game state
        this.updateGameState(game);
    }

    /**
     * Show build menu
     */
    showBuildMenu() {
        if (!this.gameState) return;

        const currentPlayer = this.getCurrentPlayer();
        if (!currentPlayer) return;

        const buildableProperties = currentPlayer.properties.filter(prop => {
            const propertyData = this.board.getSpaceData(prop);
            return propertyData.type === 'property' && !propertyData.mortgaged;
        });

        if (buildableProperties.length === 0) {
            this.showNotification('You have no properties to build on.', [
                { text: 'OK', action: 'close' }
            ]);
            return;
        }

        // Create menu options
        const buttons = buildableProperties.map(propIndex => {
            const prop = this.board.getSpaceData(propIndex);
            return {
                text: `${prop.name} (৳${prop.buildCost})`,
                action: () => {
                    this.socket.buildHouse(propIndex);
                    this.notificationModal.classList.add('hidden');
                }
            };
        });

        buttons.push({ text: 'Cancel', action: 'close' });

        this.showNotification('Select property to build on:', buttons);
    }

    /**
     * Show mortgage menu
     */
    showMortgageMenu() {
        if (!this.gameState) return;

        const currentPlayer = this.getCurrentPlayer();
        if (!currentPlayer) return;

        if (currentPlayer.properties.length === 0) {
            this.showNotification('You have no properties to mortgage.', [
                { text: 'OK', action: 'close' }
            ]);
            return;
        }

        // Create menu options
        const buttons = currentPlayer.properties.map(propIndex => {
            const prop = this.board.getSpaceData(propIndex);
            
            if (prop.mortgaged) {
                // Show unmortgage option (cost is 55% of property price)
                const unmortgageValue = Math.floor(prop.price / 2 * UNMORTGAGE_INTEREST_RATE);
                return {
                    text: `Unmortgage ${prop.name} (৳${unmortgageValue})`,
                    action: () => {
                        this.socket.unmortgageProperty(propIndex);
                        this.notificationModal.classList.add('hidden');
                    }
                };
            } else {
                // Show mortgage option (receive 50% of property price)
                const mortgageValue = Math.floor(prop.price / 2);
                return {
                    text: `Mortgage ${prop.name} (৳${mortgageValue})`,
                    action: () => {
                        this.socket.mortgageProperty(propIndex);
                        this.notificationModal.classList.add('hidden');
                    }
                };
            }
        });

        buttons.push({ text: 'Cancel', action: 'close' });

        this.showNotification('Select property to mortgage/unmortgage:', buttons);
    }

    /**
     * Show trade menu
     */
    showTradeMenu() {
        // Use the global trade instance if available
        if (window.tradeInstance) {
            window.tradeInstance.showTradeModal();
        } else {
            this.showNotification('Trade system initializing...', [
                { text: 'OK', action: 'close' }
            ]);
        }
    }

    /**
     * Handle building built event
     */
    handleBuildingBuilt(data) {
        const { playerId, property, game } = data;
        
        // Find player by ID
        const player = game.players.find(p => p.id === playerId);
        const playerName = player ? player.name : 'Player';
        
        const buildingType = property.hotels > 0 ? 'hotel' : `${property.houses} house${property.houses > 1 ? 's' : ''}`;
        this.log(`${playerName} built ${buildingType} on ${property.name}`);
        
        // Update board display
        this.board.updateBuildings(property.index, property.houses || 0, property.hotels || 0);
        
        // Update game state
        this.updateGameState(game);
        
        // Track stats
        if (property.hotels > 0) {
            this.trackStats('hotel-built', {
                playerId: playerId,
                cost: property.houseCost || 0,
                propertyName: property.name
            });
        } else {
            this.trackStats('house-built', {
                playerId: playerId,
                cost: property.houseCost || 0,
                propertyName: property.name
            });
        }
    }

    /**
     * Handle property mortgaged event
     */
    handlePropertyMortgaged(data) {
        const { playerId, property, game } = data;
        
        // Find player by ID
        const player = game.players.find(p => p.id === playerId);
        const playerName = player ? player.name : 'Player';
        
        const mortgageValue = Math.floor(property.price / 2);
        this.log(`${playerName} mortgaged ${property.name} for ৳${mortgageValue}`);
        
        // Update game state
        this.updateGameState(game);
    }

    /**
     * Handle property unmortgaged event
     */
    handlePropertyUnmortgaged(data) {
        const { playerId, property, game } = data;
        
        // Find player by ID
        const player = game.players.find(p => p.id === playerId);
        const playerName = player ? player.name : 'Player';
        
        const unmortgageValue = Math.floor(property.price / 2 * 1.1);
        this.log(`${playerName} unmortgaged ${property.name} for ৳${unmortgageValue}`);
        
        // Update game state
        this.updateGameState(game);
    }

    /**
     * Handle trade offer received
     */
    handleTradeOfferReceived(data) {
        const { offer, fromPlayer } = data;
        
        this.showNotification(
            `Trade offer from ${fromPlayer.name}. Accept?`,
            [
                { text: 'Accept', action: () => {
                    this.socket.respondToTrade(offer.id, true);
                    this.notificationModal.classList.add('hidden');
                }},
                { text: 'Decline', action: () => {
                    this.socket.respondToTrade(offer.id, false);
                    this.notificationModal.classList.add('hidden');
                }}
            ]
        );
    }

    /**
     * Handle trade completed
     */
    handleTradeCompleted(data) {
        this.log(`Trade completed between players`);
        this.updateGameState(data.game);
        
        // Track stats for current player
        this.trackStats('trade-completed', {
            playerId: this.currentPlayerId
        });
    }

    /**
     * Handle property available event (unowned property landed on)
     */
    handlePropertyAvailable(data) {
        const { playerId, property, game } = data;
        
        // Update game state first
        this.updateGameState(game);
        
        // Only show prompt to the current player
        if (playerId === this.currentPlayerId) {
            this.showNotification(
                `Would you like to buy ${property.name} for ৳${property.price}?`,
                [
                    { 
                        text: 'Buy', 
                        action: () => {
                            this.socket.buyProperty();
                            this.hideNotification();
                        }
                    },
                    { 
                        text: 'Decline', 
                        action: () => {
                            this.hideNotification();
                        }
                    }
                ]
            );
        } else {
            const player = game.players.find(p => p.id === playerId);
            const playerName = player ? player.name : 'Player';
            this.log(`${playerName} landed on unowned ${property.name}`);
        }
    }

    /**
     * Handle rent paid event
     */
    handleRentPaid(data) {
        const { payerId, ownerId, ownerName, propertyName, amount, game } = data;
        
        // Update game state
        this.updateGameState(game);
        
        // Show notification based on whether current player is involved
        if (payerId === this.currentPlayerId) {
            this.showNotification(
                `You paid ৳${amount} rent to ${ownerName} for ${propertyName}`,
                [{ text: 'OK', action: () => this.hideNotification() }]
            );
            this.log(`You paid ৳${amount} rent to ${ownerName}`);
        } else if (ownerId === this.currentPlayerId) {
            const payer = game.players.find(p => p.id === payerId);
            const payerName = payer ? payer.name : 'Player';
            this.showNotification(
                `${payerName} paid you ৳${amount} rent for ${propertyName}`,
                [{ text: 'OK', action: () => this.hideNotification() }]
            );
            this.log(`${payerName} paid you ৳${amount} rent`);
        } else {
            const payer = game.players.find(p => p.id === payerId);
            const payerName = payer ? payer.name : 'Player';
            this.log(`${payerName} paid ৳${amount} rent to ${ownerName}`);
        }
        
        // Track stats
        if (ownerId === this.currentPlayerId) {
            this.trackStats('rent-collected', {
                playerId: this.currentPlayerId,
                amount: amount,
                propertyName: propertyName
            });
        }
    }

    /**
     * Handle card drawn event
     */
    handleCardDrawn(data) {
        const { playerId, cardType, cardText, message, game } = data;
        
        // Update game state
        this.updateGameState(game);
        
        const player = game.players.find(p => p.id === playerId);
        const playerName = player ? player.name : 'Player';
        
        const cardTypeDisplay = cardType === 'chance' ? 'Chance' : 'Community Chest';
        this.log(`${playerName} drew ${cardTypeDisplay}: "${cardText}"`);
        
        // Show notification to all players
        this.showNotification(
            `${cardTypeDisplay} Card: ${cardText}`,
            [{ text: 'OK', action: () => this.hideNotification() }]
        );
    }

    /**
     * Handle tax paid event
     */
    handleTaxPaid(data) {
        const { playerId, taxName, amount, game } = data;
        
        // Update game state
        this.updateGameState(game);
        
        const player = game.players.find(p => p.id === playerId);
        const playerName = player ? player.name : 'Player';
        
        if (playerId === this.currentPlayerId) {
            this.showNotification(
                `You paid ৳${amount} in ${taxName}`,
                [{ text: 'OK', action: () => this.hideNotification() }]
            );
            this.log(`You paid ৳${amount} in ${taxName}`);
        } else {
            this.log(`${playerName} paid ৳${amount} in ${taxName}`);
        }
    }

    /**
     * Handle go to jail event
     */
    handleGoToJail(data) {
        const { playerId, game } = data;
        
        // Update game state
        this.updateGameState(game);
        
        const player = game.players.find(p => p.id === playerId);
        const playerName = player ? player.name : 'Player';
        
        if (playerId === this.currentPlayerId) {
            this.showNotification(
                'Go directly to Jail! Do not pass Go, do not collect ৳2000.',
                [{ text: 'OK', action: () => this.hideNotification() }]
            );
            this.log('You went to Jail!');
        } else {
            this.log(`${playerName} went to Jail!`);
        }
        
        // Update player position on board
        if (player) {
            this.board.updatePlayerPosition(player.id, 10, player.color, player.token);
        }
    }

    /**
     * Handle free parking jackpot event
     */
    handleFreeParkingJackpot(data) {
        const { playerId, amount, game } = data;
        
        // Update game state
        this.updateGameState(game);
        
        const player = game.players.find(p => p.id === playerId);
        const playerName = player ? player.name : 'Player';
        
        if (playerId === this.currentPlayerId) {
            this.showNotification(
                `You collected ৳${amount} from Free Parking!`,
                [{ text: 'OK', action: () => this.hideNotification() }]
            );
            this.log(`You collected ৳${amount} from Free Parking!`);
        } else {
            this.log(`${playerName} collected ৳${amount} from Free Parking`);
        }
    }

    /**
     * Handle suggest turn end event (for non-interactive spaces)
     */
    handleSuggestTurnEnd(data) {
        const { playerId } = data;
        
        // Only enable/highlight end turn button for current player
        if (playerId === this.currentPlayerId && this.endTurnBtn) {
            this.endTurnBtn.disabled = false;
            this.endTurnBtn.classList.add('ring-4', 'ring-yellow-300');
            
            // Auto-click after a short delay to give player time to see what happened
            setTimeout(() => {
                if (this.endTurnBtn && !this.endTurnBtn.disabled) {
                    this.log('Turn completed - advancing to next player');
                    this.endTurnBtn.classList.remove('ring-4', 'ring-yellow-300');
                    this.handleEndTurn();
                }
            }, AUTO_TURN_END_DELAY_MS);
        }
    }

    /**
     * Show notification modal
     * @param {string} message - Message to display
     * @param {Array} buttons - Array of button objects {text, action}
     */
    showNotification(message, buttons) {
        const modal = document.getElementById('notification-modal');
        const messageEl = document.getElementById('notification-message');
        const buttonsEl = document.getElementById('notification-buttons');
        
        if (!modal || !messageEl || !buttonsEl) {
            console.error('Notification modal elements not found');
            return;
        }
        
        messageEl.textContent = message;
        buttonsEl.innerHTML = '';
        
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.textContent = btn.text;
            button.className = 'bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition';
            button.addEventListener('click', () => {
                if (typeof btn.action === 'function') {
                    btn.action();
                } else if (btn.action === 'close') {
                    this.hideNotification();
                }
            });
            buttonsEl.appendChild(button);
        });
        
        modal.classList.remove('hidden');
    }

    /**
     * Hide notification modal
     */
    hideNotification() {
        const modal = document.getElementById('notification-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    /**
     * Handle player bankruptcy event
     */
    handlePlayerBankrupt(data) {
        const { playerId, creditorId, game } = data;
        
        // Update game state
        this.updateGameState(game);
        
        const player = game.players.find(p => p.id === playerId);
        const playerName = player ? player.name : 'Player';
        
        if (playerId === this.currentPlayerId) {
            // Current player went bankrupt
            this.showNotification(
                `You are bankrupt! You have been eliminated from the game.`,
                [{ text: 'OK', action: () => this.hideNotification() }]
            );
            this.log('You went bankrupt and are out of the game');
            
            // Track stats
            this.trackStats('player-bankrupt', {
                playerId: this.currentPlayerId,
                creditorId: creditorId
            });
        } else if (creditorId === this.currentPlayerId) {
            // Current player bankrupted another player
            this.showNotification(
                `${playerName} is bankrupt! Their properties have been transferred to you.`,
                [{ text: 'OK', action: () => this.hideNotification() }]
            );
            this.log(`${playerName} went bankrupt - their properties are now yours!`);
            
            // Track stats
            this.trackStats('bankrupted-player', {
                playerId: this.currentPlayerId,
                bankruptedPlayerId: playerId
            });
        } else {
            // Another player went bankrupt
            this.log(`${playerName} went bankrupt and is out of the game`);
        }
    }

    /**
     * Handle game ended event
     */
    handleGameEnded(data) {
        const { winnerId, winnerName, game } = data;
        
        // Update game state
        this.updateGameState(game);
        
        // Disable all action buttons
        if (this.rollDiceBtn) this.rollDiceBtn.disabled = true;
        if (this.endTurnBtn) this.endTurnBtn.disabled = true;
        if (this.buyPropertyBtn) this.buyPropertyBtn.disabled = true;
        if (this.buildBtn) this.buildBtn.disabled = true;
        if (this.mortgageBtn) this.mortgageBtn.disabled = true;
        if (this.tradeBtn) this.tradeBtn.disabled = true;
        
        // Show winner announcement
        if (winnerId === this.currentPlayerId) {
            this.showNotification(
                `🎉 Congratulations! You won the game! 🎉`,
                [
                    { 
                        text: 'Return to Lobby', 
                        action: () => {
                            window.location.href = '/index.html';
                        }
                    }
                ]
            );
            this.log('🎉 You won the game! Congratulations!');
            
            // Track stats
            this.trackStats('game-won', {
                playerId: this.currentPlayerId
            });
        } else {
            this.showNotification(
                `Game Over! ${winnerName} won the game!`,
                [
                    { 
                        text: 'Return to Lobby', 
                        action: () => {
                            window.location.href = '/index.html';
                        }
                    }
                ]
            );
            this.log(`Game Over! ${winnerName} won!`);
        }
        
        // Track stats for game ended
        this.trackStats('game-ended', {
            playerId: this.currentPlayerId,
            winnerId: winnerId,
            duration: game.turn || 0
        });
    }

    /**
     * Initialize game from server state (first load)
     */
    initializeFromServer(gameState) {
        console.log('🎮 Initializing game from server state:', gameState);
        
        if (!gameState) {
            console.error('❌ No game state received');
            this.log('Failed to load game state');
            return;
        }
        
        try {
            // Validate we have players
            if (!gameState.players || gameState.players.length === 0) {
                throw new Error('No players in game state');
            }
            
            console.log(`📋 Loading ${gameState.players.length} players...`);
            gameState.players.forEach((player, index) => {
                console.log(`  ✓ Player ${index + 1}: ${player.name} (${player.color || CONSTANTS.PLAYER_COLORS[index]})`);
            });
            
            // Use existing updateGameState method to handle the state
            this.updateGameState(gameState);
            
            // Add welcome log message
            this.log('🎲 Game started! Good luck!');
            const currentPlayer = gameState.players[gameState.currentPlayerIndex];
            if (currentPlayer) {
                this.log(`${currentPlayer.name}'s turn`);
            }
            
            console.log('✅ Game initialization complete!');
            
        } catch (error) {
            console.error('❌ Error initializing game:', error);
            this.log(`Failed to initialize: ${error.message}`);
        }
    }

    /**
     * Update entire game state
     */
    updateGameState(game) {
        if (!game) {
            console.error('❌ updateGameState called with null/undefined game');
            return;
        }
        
        try {
            this.gameState = game;
            
            // Validate required data
            if (!game.players || game.players.length === 0) {
                console.error('❌ Game state has no players');
                return;
            }
            
            // Update player info panels
            this.updatePlayerPanels(game.players, game.currentPlayerIndex);
            
            // Update player positions on board
            game.players.forEach(player => {
                if (player && player.id !== undefined) {
                    this.board.updatePlayerPosition(
                        player.id,
                        player.position || 0,
                        player.color || CONSTANTS.PLAYER_COLORS[game.players.indexOf(player)],
                        player.token || CONSTANTS.PLAYER_TOKENS[game.players.indexOf(player)]
                    );
                }
            });

            // Update turn indicator
            const currentPlayer = game.players[game.currentPlayerIndex];
            if (currentPlayer && this.turnIndicator) {
                this.turnIndicator.textContent = `${currentPlayer.name}'s Turn`;
            }

            // Update button states
            this.updateButtonStates(game);

            // Update property ownerships
            if (game.board && Array.isArray(game.board)) {
                game.board.forEach((space, index) => {
                    if (space.owner) {
                        const owner = game.players.find(p => p.id === space.owner);
                        if (owner) {
                            const ownerIndex = game.players.indexOf(owner);
                            this.board.updatePropertyOwnership(index, CONSTANTS.PLAYER_COLORS[ownerIndex]);
                        }
                    }

                    // Update buildings
                    if (space.houses || space.hotels) {
                        this.board.updateBuildings(index, space.houses || 0, space.hotels || 0);
                    }
                });
            }
        } catch (error) {
            console.error('❌ Error updating game state:', error);
            this.log(`Error updating game: ${error.message}`);
        }
    }

    /**
     * Update player info panels
     */
    updatePlayerPanels(players, currentPlayerIndex) {
        this.playerInfoPanels.innerHTML = '';

        players.forEach((player, index) => {
            const panel = document.createElement('div');
            panel.className = 'player-info';
            
            if (index === currentPlayerIndex) {
                panel.classList.add('active-player');
            }

            const color = player.color || CONSTANTS.PLAYER_COLORS[index];
            const token = player.token || CONSTANTS.PLAYER_TOKENS[index];

            panel.innerHTML = `
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-full border-2 border-white" style="background-color: ${color}">
                            <span class="text-xs">${token}</span>
                        </div>
                        <span class="font-bold">${player.name}</span>
                    </div>
                    ${player.id === this.currentPlayerId ? '<span class="text-xs bg-blue-500 text-white px-2 py-1 rounded">You</span>' : ''}
                </div>
                <div class="text-sm">
                    <p><strong>Money:</strong> ৳${player.money.toLocaleString()}</p>
                    <p><strong>Position:</strong> Space ${player.position}</p>
                    <p><strong>Properties:</strong> ${player.properties ? player.properties.length : 0}</p>
                    ${player.inJail ? '<p class="text-red-600 font-bold">IN JAIL</p>' : ''}
                </div>
            `;

            this.playerInfoPanels.appendChild(panel);
        });
    }

    /**
     * Update button states based on game state
     */
    updateButtonStates(game) {
        const isMyTurn = this.isMyTurn(game);
        const currentPlayer = this.getCurrentPlayer();

        // Roll dice button - only if it's my turn and dice haven't been rolled yet
        // Check if dice are both zero (initial state) or if turn actions are not completed
        const hasRolled = game.dice && game.dice.length === 2 && (game.dice[0] !== 0 || game.dice[1] !== 0);
        this.rollDiceBtn.disabled = !isMyTurn || hasRolled;

        // End turn button - only if it's my turn and dice have been rolled
        this.endTurnBtn.disabled = !isMyTurn || !hasRolled;

        // Buy property button
        if (isMyTurn && currentPlayer) {
            const currentSpace = game.board[currentPlayer.position];
            const canBuy = currentSpace && 
                          (currentSpace.type === 'property' || currentSpace.type === 'station' || currentSpace.type === 'utility') &&
                          !currentSpace.owner &&
                          currentPlayer.money >= currentSpace.price;
            this.buyPropertyBtn.disabled = !canBuy;
        } else {
            this.buyPropertyBtn.disabled = true;
        }

        // Build, mortgage, trade buttons - only on my turn
        this.buildBtn.disabled = !isMyTurn;
        this.mortgageBtn.disabled = !isMyTurn;
        this.tradeBtn.disabled = !isMyTurn;
    }

    /**
     * Check if it's current player's turn
     */
    isMyTurn(game) {
        if (!game || !this.currentPlayerId) return false;
        const currentPlayer = game.players[game.currentPlayerIndex];
        return currentPlayer && currentPlayer.id === this.currentPlayerId;
    }

    /**
     * Get current player object
     */
    getCurrentPlayer() {
        if (!this.gameState || !this.currentPlayerId) return null;
        return this.gameState.players.find(p => p.id === this.currentPlayerId);
    }

    /**
     * Log message to game log
     */
    log(message) {
        const p = document.createElement('p');
        p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        this.logScreen.appendChild(p);
        this.logScreen.scrollTop = this.logScreen.scrollHeight;
    }

    /**
     * Show notification modal
     */
    showNotification(message, buttons) {
        this.notificationMessage.textContent = message;
        this.notificationButtons.innerHTML = '';

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.textContent = btn.text;
            button.className = 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mx-1';
            
            if (btn.action === 'close') {
                button.onclick = () => {
                    this.notificationModal.classList.add('hidden');
                };
            } else if (typeof btn.action === 'function') {
                button.onclick = btn.action;
            }

            this.notificationButtons.appendChild(button);
        });

        this.notificationModal.classList.remove('hidden');
    }
}

// Make Game available globally
if (typeof window !== 'undefined') {
    window.Game = Game;
}
