/**
 * Game Persistence UI Component
 * Handles save/load game functionality
 */

class GamePersistence {
    constructor(socketClient) {
        this.socket = socketClient;
        this.createPersistenceUI();
        this.initialize();
    }

    /**
     * Create persistence UI modal
     */
    createPersistenceUI() {
        const modalHTML = `
            <!-- Save/Load Game Modal -->
            <div id="persistence-modal" class="fixed inset-0 bg-gray-800 bg-opacity-75 modal-overlay flex items-center justify-center z-50 hidden">
                <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold">Game Save/Load</h2>
                        <button id="close-persistence-modal" class="text-gray-500 hover:text-gray-700 text-2xl">
                            &times;
                        </button>
                    </div>
                    
                    <!-- Tabs -->
                    <div class="flex gap-2 mb-4 border-b">
                        <button id="save-tab" class="px-4 py-2 font-semibold border-b-2 border-blue-500 text-blue-600">
                            Save Game
                        </button>
                        <button id="load-tab" class="px-4 py-2 font-semibold text-gray-600 hover:text-blue-600">
                            Load Game
                        </button>
                    </div>
                    
                    <!-- Save Content -->
                    <div id="save-content" class="space-y-4">
                        <p class="text-gray-700">Save the current game state to continue later.</p>
                        
                        <div class="space-y-2">
                            <button id="save-localStorage-btn" class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded">
                                💾 Save to Browser
                            </button>
                            <p class="text-sm text-gray-500 text-center">Saved in your browser's local storage</p>
                        </div>
                        
                        <div class="space-y-2">
                            <button id="save-download-btn" class="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded">
                                📥 Download Save File
                            </button>
                            <p class="text-sm text-gray-500 text-center">Download as JSON file for backup</p>
                        </div>
                        
                        <div id="save-status" class="mt-4 p-3 rounded hidden"></div>
                    </div>
                    
                    <!-- Load Content -->
                    <div id="load-content" class="space-y-4 hidden">
                        <p class="text-gray-700">Load a previously saved game.</p>
                        
                        <!-- Saved Games List -->
                        <div>
                            <h3 class="font-semibold mb-2">Saved Games (Browser)</h3>
                            <div id="saved-games-list" class="space-y-2 max-h-64 overflow-y-auto bg-gray-50 rounded p-2">
                                <!-- Saved games will be listed here -->
                            </div>
                        </div>
                        
                        <!-- File Upload -->
                        <div class="space-y-2">
                            <h3 class="font-semibold">Load from File</h3>
                            <input type="file" id="load-file-input" accept=".json" class="w-full border border-gray-300 rounded px-3 py-2">
                            <button id="load-file-btn" class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                📤 Load from File
                            </button>
                        </div>
                        
                        <div id="load-status" class="mt-4 p-3 rounded hidden"></div>
                    </div>
                </div>
            </div>
            
            <!-- Save/Load Button (Add to game UI) -->
            <button id="persistence-btn" class="fixed top-16 right-4 bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg z-40">
                💾 Save/Load
            </button>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Initialize persistence system
     */
    initialize() {
        // Get elements
        this.modal = document.getElementById('persistence-modal');
        this.closeBtn = document.getElementById('close-persistence-modal');
        this.persistenceBtn = document.getElementById('persistence-btn');
        
        // Tab elements
        this.saveTab = document.getElementById('save-tab');
        this.loadTab = document.getElementById('load-tab');
        this.saveContent = document.getElementById('save-content');
        this.loadContent = document.getElementById('load-content');
        
        // Save elements
        this.saveLocalStorageBtn = document.getElementById('save-localStorage-btn');
        this.saveDownloadBtn = document.getElementById('save-download-btn');
        this.saveStatus = document.getElementById('save-status');
        
        // Load elements
        this.savedGamesList = document.getElementById('saved-games-list');
        this.loadFileInput = document.getElementById('load-file-input');
        this.loadFileBtn = document.getElementById('load-file-btn');
        this.loadStatus = document.getElementById('load-status');
        
        this.setupEventListeners();
        this.setupSocketListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Open modal
        this.persistenceBtn.addEventListener('click', () => this.show());
        
        // Close modal
        this.closeBtn.addEventListener('click', () => this.hide());
        
        // Tab switching
        this.saveTab.addEventListener('click', () => this.switchTab('save'));
        this.loadTab.addEventListener('click', () => this.switchTab('load'));
        
        // Save actions
        this.saveLocalStorageBtn.addEventListener('click', () => this.saveToLocalStorage());
        this.saveDownloadBtn.addEventListener('click', () => this.downloadSaveFile());
        
        // Load actions
        this.loadFileBtn.addEventListener('click', () => this.loadFromFile());
    }

    /**
     * Setup socket listeners
     */
    setupSocketListeners() {
        this.socket.on('game-saved', (data) => {
            this.showStatus('save', 'Game saved successfully!', 'success');
        });
        
        this.socket.on('game-state-retrieved', (data) => {
            this.currentGameState = data.gameState;
        });
    }

    /**
     * Show modal
     */
    show() {
        this.modal.classList.remove('hidden');
        this.switchTab('save');
        this.refreshSavedGamesList();
    }

    /**
     * Hide modal
     */
    hide() {
        this.modal.classList.add('hidden');
    }

    /**
     * Switch tab
     */
    switchTab(tab) {
        if (tab === 'save') {
            this.saveTab.classList.add('border-blue-500', 'text-blue-600');
            this.saveTab.classList.remove('text-gray-600');
            this.loadTab.classList.remove('border-blue-500', 'text-blue-600');
            this.loadTab.classList.add('text-gray-600');
            
            this.saveContent.classList.remove('hidden');
            this.loadContent.classList.add('hidden');
        } else {
            this.loadTab.classList.add('border-blue-500', 'text-blue-600');
            this.loadTab.classList.remove('text-gray-600');
            this.saveTab.classList.remove('border-blue-500', 'text-blue-600');
            this.saveTab.classList.add('text-gray-600');
            
            this.loadContent.classList.remove('hidden');
            this.saveContent.classList.add('hidden');
            
            this.refreshSavedGamesList();
        }
    }

    /**
     * Save to localStorage
     */
    async saveToLocalStorage() {
        try {
            this.showStatus('save', 'Saving game...', 'info');
            
            // Request game state from server
            this.socket.emit('save-game', {});
            
            // Wait for response (handled by socket listener)
            setTimeout(() => {
                // Get current game state
                this.socket.emit('get-game-state', {});
                
                setTimeout(() => {
                    if (this.currentGameState) {
                        const success = window.GameState.saveToLocalStorage(
                            this.currentGameState, 
                            this.currentGameState.roomCode
                        );
                        
                        if (success) {
                            this.showStatus('save', 'Game saved to browser!', 'success');
                        } else {
                            this.showStatus('save', 'Failed to save game', 'error');
                        }
                    }
                }, 500);
            }, 500);
        } catch (error) {
            this.showStatus('save', `Error: ${error.message}`, 'error');
        }
    }

    /**
     * Download save file
     */
    async downloadSaveFile() {
        try {
            this.showStatus('save', 'Preparing download...', 'info');
            
            // Request game state from server
            this.socket.emit('save-game', {});
            
            setTimeout(() => {
                this.socket.emit('get-game-state', {});
                
                setTimeout(() => {
                    if (this.currentGameState) {
                        const filename = `monopoly_save_${this.currentGameState.roomCode}_${Date.now()}.json`;
                        const success = window.GameState.exportToFile(this.currentGameState, filename);
                        
                        if (success) {
                            this.showStatus('save', 'Save file downloaded!', 'success');
                        } else {
                            this.showStatus('save', 'Failed to download save file', 'error');
                        }
                    }
                }, 500);
            }, 500);
        } catch (error) {
            this.showStatus('save', `Error: ${error.message}`, 'error');
        }
    }

    /**
     * Load from file
     */
    loadFromFile() {
        const file = this.loadFileInput.files[0];
        
        if (!file) {
            this.showStatus('load', 'Please select a file', 'warning');
            return;
        }
        
        this.showStatus('load', 'Loading game...', 'info');
        
        window.GameState.importFromFile(file, (error, gameState) => {
            if (error) {
                this.showStatus('load', `Error: ${error.message}`, 'error');
                return;
            }
            
            // Validate game state
            const validation = window.GameState.validate(gameState);
            if (!validation.valid) {
                this.showStatus('load', `Invalid save file: ${validation.errors.join(', ')}`, 'error');
                return;
            }
            
            // Store to localStorage
            window.GameState.saveToLocalStorage(gameState, gameState.roomCode);
            
            this.showStatus('load', 'Game loaded! Refresh page to start from this save.', 'success');
            this.refreshSavedGamesList();
        });
    }

    /**
     * Refresh saved games list
     */
    refreshSavedGamesList() {
        const savedGames = window.GameState.listSavedGames();
        
        if (savedGames.length === 0) {
            this.savedGamesList.innerHTML = '<p class="text-gray-500 text-center py-4">No saved games found</p>';
            return;
        }
        
        this.savedGamesList.innerHTML = '';
        
        savedGames.forEach(save => {
            const item = document.createElement('div');
            item.className = 'flex justify-between items-center p-3 bg-white rounded border hover:bg-blue-50';
            
            const date = new Date(save.timestamp).toLocaleString();
            
            item.innerHTML = `
                <div class="flex-1">
                    <div class="font-semibold">Room: ${save.roomCode}</div>
                    <div class="text-sm text-gray-600">Turn ${save.turnNumber} • ${save.playerCount} players • ${save.status}</div>
                    <div class="text-xs text-gray-500">${date}</div>
                </div>
                <div class="flex gap-2">
                    <button class="load-save-btn bg-blue-500 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm" data-room="${save.roomCode}">
                        Load
                    </button>
                    <button class="delete-save-btn bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded text-sm" data-room="${save.roomCode}">
                        Delete
                    </button>
                </div>
            `;
            
            // Add event listeners
            item.querySelector('.load-save-btn').addEventListener('click', () => {
                this.loadFromLocalStorage(save.roomCode);
            });
            
            item.querySelector('.delete-save-btn').addEventListener('click', () => {
                this.deleteSave(save.roomCode);
            });
            
            this.savedGamesList.appendChild(item);
        });
    }

    /**
     * Load from localStorage
     */
    loadFromLocalStorage(roomCode) {
        const gameState = window.GameState.loadFromLocalStorage(roomCode);
        
        if (!gameState) {
            this.showStatus('load', 'Failed to load game', 'error');
            return;
        }
        
        this.showStatus('load', 'Game loaded! Refresh page or rejoin room to continue.', 'success');
        
        // TODO: Implement actual game state restoration
        // This would require server-side support to restore game state
    }

    /**
     * Delete save
     */
    deleteSave(roomCode) {
        if (confirm('Are you sure you want to delete this save?')) {
            const success = window.GameState.deleteSavedGame(roomCode);
            
            if (success) {
                this.showStatus('load', 'Save deleted', 'success');
                this.refreshSavedGamesList();
            } else {
                this.showStatus('load', 'Failed to delete save', 'error');
            }
        }
    }

    /**
     * Show status message
     */
    showStatus(type, message, level) {
        const statusEl = type === 'save' ? this.saveStatus : this.loadStatus;
        
        statusEl.classList.remove('hidden', 'bg-blue-100', 'bg-green-100', 'bg-red-100', 'bg-yellow-100');
        statusEl.classList.remove('text-blue-800', 'text-green-800', 'text-red-800', 'text-yellow-800');
        
        if (level === 'success') {
            statusEl.classList.add('bg-green-100', 'text-green-800');
        } else if (level === 'error') {
            statusEl.classList.add('bg-red-100', 'text-red-800');
        } else if (level === 'warning') {
            statusEl.classList.add('bg-yellow-100', 'text-yellow-800');
        } else {
            statusEl.classList.add('bg-blue-100', 'text-blue-800');
        }
        
        statusEl.textContent = message;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            statusEl.classList.add('hidden');
        }, 5000);
    }
}

// Make GamePersistence available globally
if (typeof window !== 'undefined') {
    window.GamePersistence = GamePersistence;
}
