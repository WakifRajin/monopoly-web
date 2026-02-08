/**
 * Lobby UI
 * Handles the lobby interface and room management
 */

class LobbyUI {
    constructor() {
        this.currentRoom = null;
        this.currentPlayerId = null;
        this.isHost = false;
        this.isReady = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupSocketListeners();
    }

    initializeElements() {
        // Sections
        this.landingSection = Helpers.$('landing-section');
        this.roomSection = Helpers.$('room-section');
        
        // Buttons
        this.createRoomBtn = Helpers.$('create-room-btn');
        this.joinRoomBtn = Helpers.$('join-room-btn');
        this.refreshRoomsBtn = Helpers.$('refresh-rooms-btn');
        this.leaveRoomBtn = Helpers.$('leave-room-btn');
        this.readyBtn = Helpers.$('ready-btn');
        this.startGameBtn = Helpers.$('start-game-btn');
        
        // Modals
        this.createRoomModal = Helpers.$('create-room-modal');
        this.joinRoomModal = Helpers.$('join-room-modal');
        
        // Lists
        this.publicRoomsList = Helpers.$('public-rooms-list');
        this.playersList = Helpers.$('players-list');
        
        // Connection status
        this.connectionStatus = Helpers.$('connection-status');
    }

    setupEventListeners() {
        // Create Room Modal
        this.createRoomBtn?.addEventListener('click', () => this.showCreateRoomModal());
        Helpers.$('create-room-confirm-btn')?.addEventListener('click', () => this.handleCreateRoom());
        
        // Join Room Modal
        this.joinRoomBtn?.addEventListener('click', () => this.showJoinRoomModal());
        Helpers.$('join-room-confirm-btn')?.addEventListener('click', () => this.handleJoinRoom());
        
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    Helpers.hide(modal);
                }
            });
        });
        
        // Close modal on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    Helpers.hide(modal);
                }
            });
        });
        
        // Refresh rooms
        this.refreshRoomsBtn?.addEventListener('click', () => this.refreshPublicRooms());
        
        // Leave room
        this.leaveRoomBtn?.addEventListener('click', () => this.handleLeaveRoom());
        
        // Ready button
        this.readyBtn?.addEventListener('click', () => this.handleReadyToggle());
        
        // Start game button
        this.startGameBtn?.addEventListener('click', () => this.handleStartGame());
        
        // Room code input - auto uppercase
        const roomCodeInput = Helpers.$('room-code-input');
        if (roomCodeInput) {
            roomCodeInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
        }
        
        // Max players select - update room settings when changed (only for host)
        const maxPlayersSelect = Helpers.$('max-players-select');
        if (maxPlayersSelect) {
            maxPlayersSelect.addEventListener('change', (e) => {
                if (this.isHost && this.currentRoom) {
                    const maxPlayers = parseInt(e.target.value, 10);
                    socketClient.emit('update-room-settings', { maxPlayers });
                }
            });
        }
    }

    setupSocketListeners() {
        // Connection events
        socketClient.on('connection-changed', (data) => this.handleConnectionChange(data));
        socketClient.on('error', (data) => notifications.error(data.message));
        
        // Room events
        socketClient.on('room-created', (data) => this.handleRoomCreated(data));
        socketClient.on('room-joined', (data) => this.handleRoomJoined(data));
        socketClient.on('player-joined', (data) => this.handlePlayerJoined(data));
        socketClient.on('player-left', (data) => this.handlePlayerLeft(data));
        socketClient.on('player-ready-changed', (data) => this.handlePlayerReadyChanged(data));
        socketClient.on('room-left', (data) => this.handleRoomLeft(data));
        socketClient.on('game-started', (data) => this.handleGameStarted(data));
        socketClient.on('public-rooms-list', (data) => this.handlePublicRoomsList(data));
        socketClient.on('room-settings-updated', (data) => this.handleRoomSettingsUpdated(data));
    }

    showCreateRoomModal() {
        Helpers.show(this.createRoomModal);
        Helpers.$('host-name')?.focus();
    }

    showJoinRoomModal() {
        Helpers.show(this.joinRoomModal);
        Helpers.$('player-name')?.focus();
    }

    handleCreateRoom() {
        const hostName = Helpers.$('host-name')?.value.trim();
        const isPublic = Helpers.$('room-public')?.checked;
        const maxPlayers = parseInt(Helpers.$('create-max-players-select')?.value || '4', 10);
        
        if (!Helpers.isValidPlayerName(hostName)) {
            notifications.error('Please enter a valid name (1-20 characters)');
            return;
        }
        
        socketClient.createRoom(hostName, { isPublic, maxPlayers });
        Helpers.hide(this.createRoomModal);
    }

    handleJoinRoom() {
        const playerName = Helpers.$('player-name')?.value.trim();
        const roomCode = Helpers.$('room-code-input')?.value.trim().toUpperCase();
        
        if (!Helpers.isValidPlayerName(playerName)) {
            notifications.error('Please enter a valid name (1-20 characters)');
            return;
        }
        
        if (!Helpers.isValidRoomCode(roomCode)) {
            notifications.error('Please enter a valid 6-digit room code');
            return;
        }
        
        socketClient.joinRoom(playerName, roomCode);
        Helpers.hide(this.joinRoomModal);
    }

    handleLeaveRoom() {
        if (confirm('Are you sure you want to leave the room?')) {
            socketClient.leaveRoom();
        }
    }

    handleReadyToggle() {
        this.isReady = !this.isReady;
        socketClient.setReady(this.isReady);
        
        if (this.readyBtn) {
            this.readyBtn.textContent = this.isReady ? 'Not Ready' : 'Ready';
            this.readyBtn.className = this.isReady 
                ? 'flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition'
                : 'flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition';
        }
    }

    handleStartGame() {
        socketClient.startGame();
    }

    refreshPublicRooms() {
        socketClient.getPublicRooms();
        this.publicRoomsList.innerHTML = '<p class="text-gray-500 text-center py-8">Loading rooms...</p>';
    }

    handleConnectionChange(data) {
        if (!this.connectionStatus) return;
        
        Helpers.show(this.connectionStatus);
        this.connectionStatus.className = `mb-6 p-4 rounded-lg shadow-md ${data.state}`;
        
        const statusText = this.connectionStatus.querySelector('.status-text');
        if (statusText) {
            const messages = {
                [CONSTANTS.CONNECTION_STATES.CONNECTED]: 'Connected to server',
                [CONSTANTS.CONNECTION_STATES.DISCONNECTED]: 'Disconnected from server',
                [CONSTANTS.CONNECTION_STATES.CONNECTING]: 'Connecting to server...'
            };
            statusText.textContent = messages[data.state] || 'Unknown status';
        }
    }

    handleRoomCreated(data) {
        this.currentRoom = data.room;
        this.currentPlayerId = data.playerId;
        this.isHost = true;
        
        notifications.success(`Room created! Code: ${data.room.code}`);
        this.showRoomSection();
        this.updateRoomDisplay();
    }

    handleRoomJoined(data) {
        this.currentRoom = data.room;
        this.currentPlayerId = data.playerId;
        this.isHost = false;
        
        notifications.success(`Joined room: ${data.room.code}`);
        this.showRoomSection();
        this.updateRoomDisplay();
    }

    handlePlayerJoined(data) {
        this.currentRoom = data.room;
        notifications.info(`${data.player.name} joined the room`);
        this.updateRoomDisplay();
    }

    handlePlayerLeft(data) {
        this.currentRoom = data.room;
        notifications.info(`A player left the room`);
        this.updateRoomDisplay();
    }

    handlePlayerReadyChanged(data) {
        this.updateRoomDisplay();
        
        if (data.allReady && this.isHost) {
            Helpers.show(this.startGameBtn);
        }
    }

    handleRoomLeft(data) {
        this.currentRoom = null;
        this.currentPlayerId = null;
        this.isHost = false;
        this.isReady = false;
        
        notifications.info('Left the room');
        this.showLandingSection();
    }

    handleGameStarted(data) {
        notifications.success('Game starting!');
        
        // Store player ID for game page
        if (this.currentPlayerId) {
            localStorage.setItem('currentPlayerId', this.currentPlayerId);
        }
        if (this.currentRoom?.code) {
            localStorage.setItem('currentRoomCode', this.currentRoom.code);
        }
        
        // Redirect to game page with room code and player ID
        setTimeout(() => {
            const roomCode = this.currentRoom?.code || data.game?.roomCode || '';
            const playerId = this.currentPlayerId || '';
            window.location.href = `/game.html?room=${roomCode}&playerId=${playerId}`;
        }, 1000);
    }

    handlePublicRoomsList(data) {
        if (!data.rooms || data.rooms.length === 0) {
            this.publicRoomsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🏠</div>
                    <p>No public rooms available</p>
                    <p class="text-sm mt-2">Create a room to get started!</p>
                </div>
            `;
            return;
        }
        
        this.publicRoomsList.innerHTML = data.rooms.map(room => `
            <div class="room-card" data-room-code="${Helpers.escapeHtml(room.code)}">
                <div class="room-info">
                    <div class="room-code">${Helpers.escapeHtml(room.code)}</div>
                    <div class="room-details">
                        <span>👤 ${room.playerCount}/${room.maxPlayers} players</span>
                        <span>🎮 Host: ${Helpers.escapeHtml(room.hostName)}</span>
                    </div>
                </div>
                <button class="join-room-btn-card" onclick="lobbyUI.quickJoinRoom('${Helpers.escapeHtml(room.code)}')">
                    Join
                </button>
            </div>
        `).join('');
    }

    quickJoinRoom(roomCode) {
        const playerName = prompt('Enter your name:');
        if (Helpers.isValidPlayerName(playerName)) {
            socketClient.joinRoom(playerName, roomCode);
        } else {
            notifications.error('Please enter a valid name');
        }
    }

    showRoomSection() {
        Helpers.hide(this.landingSection);
        Helpers.show(this.roomSection);
    }

    showLandingSection() {
        Helpers.show(this.landingSection);
        Helpers.hide(this.roomSection);
        this.refreshPublicRooms();
    }

    updateRoomDisplay() {
        if (!this.currentRoom) return;
        
        // Update room code
        const roomCodeEl = Helpers.$('room-code');
        if (roomCodeEl) {
            roomCodeEl.textContent = this.currentRoom.code;
        }
        
        // Update player count
        const playerCountEl = Helpers.$('player-count');
        const maxPlayersEl = Helpers.$('max-players');
        if (playerCountEl) playerCountEl.textContent = this.currentRoom.players.length;
        if (maxPlayersEl) maxPlayersEl.textContent = this.currentRoom.maxPlayers;
        
        // Update players list
        this.updatePlayersList();
        
        // Show/hide host-only elements
        const settingsSection = Helpers.$('game-settings-section');
        if (this.isHost) {
            Helpers.show(settingsSection);
        } else {
            Helpers.hide(settingsSection);
        }
    }

    updatePlayersList() {
        if (!this.playersList || !this.currentRoom) return;
        
        this.playersList.innerHTML = this.currentRoom.players.map(player => {
            const isCurrentPlayer = player.id === this.currentPlayerId;
            const badges = [];
            
            if (player.isHost) badges.push('<span class="badge badge-host">Host</span>');
            if (player.isReady) badges.push('<span class="badge badge-ready">Ready</span>');
            
            return `
                <div class="player-card ${player.isReady ? 'ready' : ''}">
                    <div class="player-info">
                        <div class="player-token" style="color: ${player.color}">
                            ${player.token}
                        </div>
                        <div class="player-details">
                            <div class="player-name">
                                ${Helpers.escapeHtml(player.name)}
                                ${isCurrentPlayer ? '(You)' : ''}
                            </div>
                            <div class="player-badges">
                                ${badges.join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    handleRoomSettingsUpdated(data) {
        if (!data.room) return;
        
        this.currentRoom = data.room;
        this.updateRoomDisplay();
        
        // Update the max players select if it exists (for host)
        const maxPlayersSelect = Helpers.$('max-players-select');
        if (maxPlayersSelect && data.room.maxPlayers) {
            maxPlayersSelect.value = data.room.maxPlayers.toString();
        }
        
        // Only show notification to non-host players
        if (!this.isHost) {
            notifications.info(`Room settings updated: Max players set to ${data.room.maxPlayers}`);
        }
    }
}

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
    let retryCount = 0;
    const MAX_RETRIES = 50; // 5 seconds maximum wait time
    
    const initLobby = () => {
        // Ensure socketClient exists and is properly initialized before creating lobby
        if (typeof socketClient !== 'undefined' && socketClient.socket) {
            window.lobbyUI = new LobbyUI();
            console.log('Lobby UI initialized');
            
            // Load public rooms initially
            setTimeout(() => {
                socketClient.getPublicRooms();
            }, 500);
        } else if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log('Waiting for socket client... retrying in 100ms');
            setTimeout(initLobby, 100);
        } else {
            console.error('Failed to initialize: Socket client not available after maximum retries');
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLobby);
    } else {
        initLobby();
    }
}
