/**
 * Socket Client
 * Handles WebSocket communication with the server
 */

class SocketClient {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.currentRoom = null;
        this.currentPlayerId = null;
        this.eventHandlers = {};
    }

    /**
     * Connect to the server
     */
    connect() {
        this.socket = io(CONSTANTS.SERVER_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        this.setupConnectionHandlers();
        this.setupGameHandlers();
    }

    /**
     * Setup connection event handlers
     */
    setupConnectionHandlers() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.connected = true;
            this.emit('connection-changed', { state: CONSTANTS.CONNECTION_STATES.CONNECTED });
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.connected = false;
            this.emit('connection-changed', { state: CONSTANTS.CONNECTION_STATES.DISCONNECTED });
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.emit('connection-changed', { state: CONSTANTS.CONNECTION_STATES.CONNECTING });
        });

        this.socket.on('error', (data) => {
            console.error('Server error:', data.message);
            this.emit('error', data);
        });
    }

    /**
     * Setup game event handlers
     */
    setupGameHandlers() {
        // Room events
        this.socket.on('room-created', (data) => {
            this.currentRoom = data.room;
            this.currentPlayerId = data.playerId;
            this.emit('room-created', data);
        });

        this.socket.on('room-joined', (data) => {
            this.currentRoom = data.room;
            this.currentPlayerId = data.playerId;
            this.emit('room-joined', data);
        });

        this.socket.on('player-joined', (data) => {
            this.currentRoom = data.room;
            this.emit('player-joined', data);
        });

        this.socket.on('player-left', (data) => {
            this.currentRoom = data.room;
            this.emit('player-left', data);
        });

        this.socket.on('player-ready-changed', (data) => {
            this.emit('player-ready-changed', data);
        });

        this.socket.on('room-left', (data) => {
            this.currentRoom = null;
            this.currentPlayerId = null;
            this.emit('room-left', data);
        });

        this.socket.on('game-started', (data) => {
            this.emit('game-started', data);
        });

        this.socket.on('public-rooms-list', (data) => {
            this.emit('public-rooms-list', data);
        });

        // Game events
        this.socket.on('dice-rolled', (data) => {
            this.emit('dice-rolled', data);
        });

        this.socket.on('property-bought', (data) => {
            this.emit('property-bought', data);
        });

        this.socket.on('turn-changed', (data) => {
            this.emit('turn-changed', data);
        });

        this.socket.on('building-built', (data) => {
            this.emit('building-built', data);
        });

        this.socket.on('property-mortgaged', (data) => {
            this.emit('property-mortgaged', data);
        });

        this.socket.on('property-unmortgaged', (data) => {
            this.emit('property-unmortgaged', data);
        });

        // Trade events
        this.socket.on('trade-offer-received', (data) => {
            this.emit('trade-offer-received', data);
        });

        this.socket.on('trade-completed', (data) => {
            this.emit('trade-completed', data);
        });

        // Chat events
        this.socket.on('chat-broadcast', (data) => {
            this.emit('chat-message', data);
        });
    }

    /**
     * Register event handler
     */
    on(event, handler) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(handler);
    }

    /**
     * Emit event to handlers
     */
    emit(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(handler => handler(data));
        }
    }

    /**
     * Create a room
     */
    createRoom(hostName, settings = {}) {
        this.socket.emit('create-room', {
            hostName,
            isPublic: settings.isPublic !== undefined ? settings.isPublic : true,
            maxPlayers: settings.maxPlayers || 4,
            startingMoney: settings.startingMoney,
            goSalary: settings.goSalary,
            jailFine: settings.jailFine,
            freeParkingJackpot: settings.freeParkingJackpot,
            auctionEnabled: settings.auctionEnabled,
            turnTimeLimit: settings.turnTimeLimit,
            fastMode: settings.fastMode
        });
    }

    /**
     * Join a room
     */
    joinRoom(playerName, roomCode) {
        this.socket.emit('join-room', {
            playerName,
            roomCode: roomCode.toUpperCase()
        });
    }

    /**
     * Leave current room
     */
    leaveRoom() {
        this.socket.emit('leave-room');
    }

    /**
     * Set player ready status
     */
    setReady(isReady) {
        this.socket.emit('player-ready', { isReady });
    }

    /**
     * Start the game (host only)
     */
    startGame() {
        this.socket.emit('start-game');
    }

    /**
     * Get public rooms list
     */
    getPublicRooms() {
        this.socket.emit('get-public-rooms');
    }

    /**
     * Roll dice
     */
    rollDice() {
        this.socket.emit('roll-dice');
    }

    /**
     * Buy property
     */
    buyProperty() {
        this.socket.emit('buy-property');
    }

    /**
     * End turn
     */
    endTurn() {
        this.socket.emit('end-turn');
    }

    /**
     * Build house
     */
    buildHouse(propertyIndex) {
        this.socket.emit('build-house', { propertyIndex });
    }

    /**
     * Mortgage property
     */
    mortgageProperty(propertyIndex) {
        this.socket.emit('mortgage-property', { propertyIndex });
    }

    /**
     * Unmortgage property
     */
    unmortgageProperty(propertyIndex) {
        this.socket.emit('unmortgage-property', { propertyIndex });
    }

    /**
     * Pay jail fine
     */
    payJailFine() {
        this.socket.emit('pay-jail-fine');
    }

    /**
     * Use get out of jail free card
     */
    useJailCard() {
        this.socket.emit('use-jail-card');
    }

    /**
     * Send trade offer
     */
    sendTradeOffer(toPlayerId, offer) {
        this.socket.emit('trade-offer', { toPlayerId, offer });
    }

    /**
     * Respond to trade offer
     */
    respondToTrade(tradeId, accept) {
        this.socket.emit('trade-response', { tradeId, accept });
    }

    /**
     * Send chat message
     */
    sendChatMessage(message) {
        this.socket.emit('chat-message', { message });
    }

    /**
     * Get current room
     */
    getCurrentRoom() {
        return this.currentRoom;
    }

    /**
     * Get current player ID
     */
    getCurrentPlayerId() {
        return this.currentPlayerId;
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.connected;
    }
}

// Create global socket client instance
if (typeof window !== 'undefined') {
    window.socketClient = new SocketClient();
}
