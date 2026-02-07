/**
 * Room Model
 * Represents a game room/lobby
 */

const { generateRoomCode } = require('../utils/validators');

class Room {
    constructor(hostPlayer, settings = {}) {
        this.code = generateRoomCode();
        this.hostId = hostPlayer.id;
        this.players = [hostPlayer];
        this.isPublic = settings.isPublic !== undefined ? settings.isPublic : true;
        this.maxPlayers = settings.maxPlayers || 4;
        this.status = 'waiting'; // waiting, ready, playing, finished
        this.createdAt = Date.now();
        this.settings = {
            startingMoney: settings.startingMoney || 15000,
            goSalary: settings.goSalary || 2000,
            jailFine: settings.jailFine || 500,
            freeParkingJackpot: settings.freeParkingJackpot || false,
            auctionEnabled: settings.auctionEnabled !== undefined ? settings.auctionEnabled : true,
            turnTimeLimit: settings.turnTimeLimit || 120000,
            fastMode: settings.fastMode || false
        };
    }

    /**
     * Add player to room
     */
    addPlayer(player) {
        if (this.players.length >= this.maxPlayers) {
            throw new Error('Room is full');
        }
        
        if (this.status !== 'waiting') {
            throw new Error('Game has already started');
        }
        
        // Check for duplicate names
        if (this.players.some(p => p.name === player.name)) {
            throw new Error('Player name already exists in room');
        }
        
        this.players.push(player);
        return true;
    }

    /**
     * Remove player from room
     */
    removePlayer(playerId) {
        const index = this.players.findIndex(p => p.id === playerId);
        if (index > -1) {
            this.players.splice(index, 1);
            
            // If host left, assign new host
            if (playerId === this.hostId && this.players.length > 0) {
                this.hostId = this.players[0].id;
                this.players[0].isHost = true;
            }
            
            return true;
        }
        return false;
    }

    /**
     * Get player by ID
     */
    getPlayer(playerId) {
        return this.players.find(p => p.id === playerId);
    }

    /**
     * Get player by socket ID
     */
    getPlayerBySocketId(socketId) {
        return this.players.find(p => p.socketId === socketId);
    }

    /**
     * Check if all players are ready
     */
    areAllPlayersReady() {
        if (this.players.length < 2) return false;
        return this.players.every(p => p.isReady);
    }

    /**
     * Check if room is full
     */
    isFull() {
        return this.players.length >= this.maxPlayers;
    }

    /**
     * Check if room is empty
     */
    isEmpty() {
        return this.players.length === 0;
    }

    /**
     * Start the game
     */
    startGame() {
        if (this.players.length < 2) {
            throw new Error('Need at least 2 players to start');
        }
        
        if (!this.areAllPlayersReady()) {
            throw new Error('Not all players are ready');
        }
        
        this.status = 'playing';
        return true;
    }

    /**
     * Serialize room data for client
     */
    toJSON() {
        return {
            code: this.code,
            hostId: this.hostId,
            players: this.players.map(p => p.toJSON()),
            isPublic: this.isPublic,
            maxPlayers: this.maxPlayers,
            status: this.status,
            createdAt: this.createdAt,
            settings: this.settings
        };
    }

    /**
     * Get room summary (for lobby list)
     */
    getSummary() {
        return {
            code: this.code,
            playerCount: this.players.length,
            maxPlayers: this.maxPlayers,
            status: this.status,
            isPublic: this.isPublic,
            hostName: this.players.find(p => p.id === this.hostId)?.name || 'Unknown'
        };
    }
}

module.exports = Room;
