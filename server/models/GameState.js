/**
 * Game State Model
 * Handles game state serialization and persistence
 * 
 * NOTE: This file is designed to work in BOTH Node.js (server) and browser (client) environments.
 * Methods that use browser APIs (localStorage, Blob, etc.) are for CLIENT-SIDE use only.
 * The core serialization/deserialization methods work in both environments.
 */

class GameState {
    /**
     * Serialize game state to JSON
     */
    static serialize(game) {
        return {
            gameId: game.roomCode,
            roomCode: game.roomCode,
            timestamp: Date.now(),
            version: '1.0.0',
            
            // Game status
            status: game.status,
            startedAt: game.startedAt,
            turnNumber: game.turnNumber,
            currentPlayerIndex: game.currentPlayerIndex,
            
            // Turn state
            dice: game.dice,
            doublesCount: game.doublesCount,
            turnActionsCompleted: game.turnActionsCompleted,
            
            // Players
            players: game.players.map(player => this.serializePlayer(player)),
            
            // Board state
            board: game.board.map(space => this.serializeSpace(space)),
            
            // Card decks
            chanceCardIndex: game.chanceCardIndex,
            communityChestCardIndex: game.communityChestCardIndex,
            
            // Building inventory
            availableHouses: game.availableHouses,
            availableHotels: game.availableHotels,
            
            // Free Parking jackpot
            freeParkingJackpot: game.freeParkingJackpot,
            
            // Game history
            history: game.history.slice(-100), // Last 100 events
            
            // Active trades
            activeTrades: game.activeTrades || [],
            
            // Settings
            settings: game.settings
        };
    }

    /**
     * Serialize player
     */
    static serializePlayer(player) {
        return {
            id: player.id,
            name: player.name,
            color: player.color,
            token: player.token,
            money: player.money,
            position: player.position,
            properties: player.properties || [],
            isInJail: player.isInJail || false,
            jailTurns: player.jailTurns || 0,
            getOutOfJailFreeCards: player.getOutOfJailFreeCards || 0,
            isBankrupt: player.isBankrupt || false,
            isReady: player.isReady || false
        };
    }

    /**
     * Serialize board space
     */
    static serializeSpace(space) {
        if (!space.price) {
            // Special spaces (GO, Jail, etc.)
            return {
                index: space.index,
                name: space.name,
                type: space.type,
                amount: space.amount
            };
        }
        
        // Property, Station, or Utility
        return {
            index: space.index,
            name: space.name,
            type: space.type,
            price: space.price,
            rent: space.rent,
            owner: space.owner,
            mortgaged: space.mortgaged || false,
            houses: space.houses || 0,
            hotels: space.hotels || 0,
            group: space.group,
            color: space.color,
            buildCost: space.buildCost
        };
    }

    /**
     * Deserialize game state from JSON
     */
    static deserialize(data) {
        // Validate version
        if (data.version !== '1.0.0') {
            throw new Error('Incompatible game state version');
        }
        
        return data;
    }

    /**
     * Save game state to localStorage
     * CLIENT-SIDE ONLY - Do not call from server
     */
    static saveToLocalStorage(gameState, roomCode) {
        if (typeof localStorage === 'undefined') {
            console.warn('localStorage not available (server environment)');
            return false;
        }
        
        try {
            const serialized = JSON.stringify(gameState);
            const key = `monopoly_save_${roomCode}`;
            localStorage.setItem(key, serialized);
            localStorage.setItem(`${key}_timestamp`, Date.now().toString());
            return true;
        } catch (error) {
            console.error('Error saving game state:', error);
            return false;
        }
    }

    /**
     * Load game state from localStorage
     * CLIENT-SIDE ONLY - Do not call from server
     */
    static loadFromLocalStorage(roomCode) {
        if (typeof localStorage === 'undefined') {
            console.warn('localStorage not available (server environment)');
            return null;
        }
        
        try {
            const key = `monopoly_save_${roomCode}`;
            const serialized = localStorage.getItem(key);
            
            if (!serialized) {
                return null;
            }
            
            const gameState = JSON.parse(serialized);
            return this.deserialize(gameState);
        } catch (error) {
            console.error('Error loading game state:', error);
            return null;
        }
    }

    /**
     * List all saved games
     * CLIENT-SIDE ONLY - Do not call from server
     */
    static listSavedGames() {
        if (typeof localStorage === 'undefined') {
            console.warn('localStorage not available (server environment)');
            return [];
        }
        
        const savedGames = [];
        
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                
                if (key && key.startsWith('monopoly_save_')) {
                    try {
                        const roomCode = key.replace('monopoly_save_', '');
                        const timestampKey = `${key}_timestamp`;
                        const timestamp = parseInt(localStorage.getItem(timestampKey) || '0');
                        
                        const serialized = localStorage.getItem(key);
                        if (serialized) {
                            const gameState = JSON.parse(serialized);
                            
                            savedGames.push({
                                roomCode: roomCode,
                                timestamp: timestamp,
                                turnNumber: gameState.turnNumber,
                                playerCount: gameState.players.length,
                                status: gameState.status
                            });
                        }
                    } catch (error) {
                        console.error('Error parsing saved game:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Error listing saved games:', error);
        }
        
        // Sort by timestamp (newest first)
        return savedGames.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Delete saved game
     * CLIENT-SIDE ONLY - Do not call from server
     */
    static deleteSavedGame(roomCode) {
        if (typeof localStorage === 'undefined') {
            console.warn('localStorage not available (server environment)');
            return false;
        }
        
        try {
            const key = `monopoly_save_${roomCode}`;
            localStorage.removeItem(key);
            localStorage.removeItem(`${key}_timestamp`);
            return true;
        } catch (error) {
            console.error('Error deleting saved game:', error);
            return false;
        }
    }

    /**
     * Export game state as JSON file
     * CLIENT-SIDE ONLY (uses browser APIs) - Do not call from server
     */
    static exportToFile(gameState, filename) {
        if (typeof Blob === 'undefined' || typeof document === 'undefined') {
            console.warn('File export not available (server environment)');
            return false;
        }
        
        try {
            const json = JSON.stringify(gameState, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename || `monopoly_save_${gameState.roomCode}_${Date.now()}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Error exporting game state:', error);
            return false;
        }
    }

    /**
     * Import game state from JSON file
     * CLIENT-SIDE ONLY (uses browser APIs) - Do not call from server
     */
    static importFromFile(file, callback) {
        if (typeof FileReader === 'undefined') {
            console.warn('File import not available (server environment)');
            callback(new Error('FileReader not available'), null);
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const gameState = JSON.parse(e.target.result);
                const deserialized = this.deserialize(gameState);
                callback(null, deserialized);
            } catch (error) {
                callback(error, null);
            }
        };
        
        reader.onerror = (error) => {
            callback(error, null);
        };
        
        reader.readAsText(file);
    }

    /**
     * Validate game state integrity
     */
    static validate(gameState) {
        const errors = [];
        
        // Check required fields
        if (!gameState.roomCode) errors.push('Missing room code');
        if (!gameState.players || !Array.isArray(gameState.players)) errors.push('Invalid players data');
        if (!gameState.board || !Array.isArray(gameState.board)) errors.push('Invalid board data');
        
        // Check board size
        if (gameState.board && gameState.board.length !== 40) {
            errors.push('Invalid board size (must be 40 spaces)');
        }
        
        // Check player count
        if (gameState.players && (gameState.players.length < 2 || gameState.players.length > 8)) {
            errors.push('Invalid player count (must be 2-8)');
        }
        
        // Check current player index
        if (gameState.currentPlayerIndex < 0 || gameState.currentPlayerIndex >= gameState.players.length) {
            errors.push('Invalid current player index');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}

// Make GameState available globally
if (typeof window !== 'undefined') {
    window.GameState = GameState;
}

// For Node.js (server-side)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameState;
}
