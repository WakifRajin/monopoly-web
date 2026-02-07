/**
 * Game Class
 * Main game logic and state management
 */

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

        this.initialize();
    }

    /**
     * Initialize game
     */
    initialize() {
        this.setupEventListeners();
        this.setupSocketListeners();
        
        // Get room code from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.roomCode = urlParams.get('room');

        if (this.roomCode) {
            this.log('Connecting to room...');
        }
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
            this.gameState = data.game;
            this.log('Game started!');
            this.updateGameState(data.game);
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

        this.socket.on('trade-offer-received', (data) => {
            this.handleTradeOfferReceived(data);
        });

        this.socket.on('trade-completed', (data) => {
            this.handleTradeCompleted(data);
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
            const mortgageValue = Math.floor(prop.price / 2);
            return {
                text: `${prop.name} (৳${mortgageValue})`,
                action: () => {
                    this.socket.mortgageProperty(propIndex);
                    this.notificationModal.classList.add('hidden');
                }
            };
        });

        buttons.push({ text: 'Cancel', action: 'close' });

        this.showNotification('Select property to mortgage:', buttons);
    }

    /**
     * Show trade menu
     */
    showTradeMenu() {
        this.showNotification('Trading feature coming soon!', [
            { text: 'OK', action: 'close' }
        ]);
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
    }

    /**
     * Update entire game state
     */
    updateGameState(game) {
        this.gameState = game;
        
        // Update player info panels
        this.updatePlayerPanels(game.players, game.currentPlayerIndex);
        
        // Update player positions on board
        game.players.forEach(player => {
            this.board.updatePlayerPosition(
                player.id,
                player.position,
                player.color || CONSTANTS.PLAYER_COLORS[game.players.indexOf(player)],
                player.token || CONSTANTS.PLAYER_TOKENS[game.players.indexOf(player)]
            );
        });

        // Update turn indicator
        const currentPlayer = game.players[game.currentPlayerIndex];
        this.turnIndicator.textContent = `${currentPlayer.name}'s Turn`;

        // Update button states
        this.updateButtonStates(game);

        // Update property ownerships
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
