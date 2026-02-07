/**
 * Statistics and Achievements UI Component
 * Displays player statistics, achievements, and leaderboard
 */

class StatsUI {
    constructor() {
        this.playerStats = null;
        this.achievements = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the stats UI system
     */
    init() {
        if (this.isInitialized) return;
        
        // Load player stats from localStorage
        const playerName = localStorage.getItem('playerName') || 'Player';
        
        // Check if PlayerStats is available
        if (typeof PlayerStats === 'undefined') {
            console.warn('PlayerStats not loaded, stats tracking disabled');
            return;
        }
        
        this.playerStats = new PlayerStats(playerName);
        
        // Initialize achievements module if available
        if (typeof Achievements !== 'undefined') {
            this.achievements = Achievements;
        } else {
            console.warn('Achievements not loaded, achievement tracking disabled');
        }
        
        this.isInitialized = true;
        console.log('Stats UI initialized');
    }

    /**
     * Show the stats modal
     */
    show() {
        this.init();
        this.createStatsModal();
    }

    /**
     * Create and display the stats modal
     */
    createStatsModal() {
        // Remove existing modal if any
        const existingModal = document.getElementById('stats-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal
        const modal = document.createElement('div');
        modal.id = 'stats-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.onclick = (e) => {
            if (e.target === modal) this.hide();
        };

        const content = document.createElement('div');
        content.className = 'bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col';
        content.onclick = (e) => e.stopPropagation();

        // Header
        const header = document.createElement('div');
        header.className = 'bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex justify-between items-center';
        header.innerHTML = `
            <h2 class="text-2xl font-bold">📊 Statistics & Achievements</h2>
            <button id="close-stats-modal" class="text-white hover:text-gray-200 text-2xl font-bold">&times;</button>
        `;

        // Tabs
        const tabs = document.createElement('div');
        tabs.className = 'flex border-b';
        tabs.innerHTML = `
            <button class="tab-btn flex-1 py-3 px-4 text-center font-semibold border-b-2 border-blue-600 text-blue-600" data-tab="stats">
                Statistics
            </button>
            <button class="tab-btn flex-1 py-3 px-4 text-center font-semibold border-b-2 border-transparent text-gray-600 hover:text-blue-600" data-tab="achievements">
                Achievements
            </button>
            <button class="tab-btn flex-1 py-3 px-4 text-center font-semibold border-b-2 border-transparent text-gray-600 hover:text-blue-600" data-tab="leaderboard">
                Leaderboard
            </button>
        `;

        // Content area
        const contentArea = document.createElement('div');
        contentArea.className = 'p-6 overflow-y-auto flex-1';
        contentArea.id = 'stats-content-area';

        // Assemble modal
        content.appendChild(header);
        content.appendChild(tabs);
        content.appendChild(contentArea);
        modal.appendChild(content);
        document.body.appendChild(modal);

        // Show initial tab
        this.showTab('stats');

        // Event listeners
        document.getElementById('close-stats-modal').onclick = () => this.hide();
        tabs.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = () => {
                const tabName = btn.dataset.tab;
                tabs.querySelectorAll('.tab-btn').forEach(b => {
                    b.classList.remove('border-blue-600', 'text-blue-600');
                    b.classList.add('border-transparent', 'text-gray-600');
                });
                btn.classList.remove('border-transparent', 'text-gray-600');
                btn.classList.add('border-blue-600', 'text-blue-600');
                this.showTab(tabName);
            };
        });
    }

    /**
     * Show a specific tab
     */
    showTab(tabName) {
        const contentArea = document.getElementById('stats-content-area');
        if (!contentArea) return;

        switch (tabName) {
            case 'stats':
                contentArea.innerHTML = this.renderStatsTab();
                break;
            case 'achievements':
                contentArea.innerHTML = this.renderAchievementsTab();
                break;
            case 'leaderboard':
                contentArea.innerHTML = this.renderLeaderboardTab();
                break;
        }
    }

    /**
     * Render the statistics tab
     */
    renderStatsTab() {
        if (!this.playerStats) {
            return '<p class="text-center text-gray-500">No statistics available</p>';
        }

        const stats = this.playerStats.stats;
        const winRate = this.playerStats.getWinRate();
        const avgDuration = this.playerStats.getAverageDuration();
        const netWorth = this.playerStats.getNetWorth();

        return `
            <div class="space-y-6">
                <!-- Summary Cards -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="bg-blue-50 p-4 rounded-lg text-center">
                        <div class="text-3xl font-bold text-blue-600">${stats.gamesPlayed}</div>
                        <div class="text-sm text-gray-600 mt-1">Games Played</div>
                    </div>
                    <div class="bg-green-50 p-4 rounded-lg text-center">
                        <div class="text-3xl font-bold text-green-600">${stats.gamesWon}</div>
                        <div class="text-sm text-gray-600 mt-1">Games Won</div>
                    </div>
                    <div class="bg-purple-50 p-4 rounded-lg text-center">
                        <div class="text-3xl font-bold text-purple-600">${winRate.toFixed(0)}%</div>
                        <div class="text-sm text-gray-600 mt-1">Win Rate</div>
                    </div>
                    <div class="bg-yellow-50 p-4 rounded-lg text-center">
                        <div class="text-3xl font-bold text-yellow-600">${stats.achievementsUnlocked?.length || 0}</div>
                        <div class="text-sm text-gray-600 mt-1">Achievements</div>
                    </div>
                </div>

                <!-- Detailed Stats -->
                <div class="grid md:grid-cols-2 gap-6">
                    <!-- Money Stats -->
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="font-bold text-lg mb-3 text-gray-800">💰 Money Statistics</h3>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Total Earned:</span>
                                <span class="font-semibold">৳${stats.totalMoneyEarned.toLocaleString()}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Total Spent:</span>
                                <span class="font-semibold">৳${stats.totalMoneySpent.toLocaleString()}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Highest Balance:</span>
                                <span class="font-semibold">৳${stats.highestMoney.toLocaleString()}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Net Worth:</span>
                                <span class="font-semibold text-green-600">৳${netWorth.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Property Stats -->
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="font-bold text-lg mb-3 text-gray-800">🏠 Property Statistics</h3>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Properties Owned:</span>
                                <span class="font-semibold">${stats.propertiesOwned}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Max Owned:</span>
                                <span class="font-semibold">${stats.maxPropertiesOwned}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Houses Built:</span>
                                <span class="font-semibold">${stats.housesBuilt}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Hotels Built:</span>
                                <span class="font-semibold">${stats.hotelsBuilt}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Activity Stats -->
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="font-bold text-lg mb-3 text-gray-800">🎮 Activity Statistics</h3>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Trades Completed:</span>
                                <span class="font-semibold">${stats.tradesCompleted}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Auctions Won:</span>
                                <span class="font-semibold">${stats.auctionsWon}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Bankruptcies Caused:</span>
                                <span class="font-semibold">${stats.bankruptciesCaused}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Times Jailed:</span>
                                <span class="font-semibold">${stats.timesJailed}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Rent Stats -->
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="font-bold text-lg mb-3 text-gray-800">💸 Rent Statistics</h3>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Rent Collected:</span>
                                <span class="font-semibold text-green-600">৳${stats.rentCollected.toLocaleString()}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Rent Paid:</span>
                                <span class="font-semibold text-red-600">৳${stats.rentPaid.toLocaleString()}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Net Rent:</span>
                                <span class="font-semibold ${stats.rentCollected - stats.rentPaid >= 0 ? 'text-green-600' : 'text-red-600'}">
                                    ৳${(stats.rentCollected - stats.rentPaid).toLocaleString()}
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Avg Duration:</span>
                                <span class="font-semibold">${avgDuration} min</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render the achievements tab
     */
    renderAchievementsTab() {
        if (!this.achievements || !this.playerStats) {
            return '<p class="text-center text-gray-500">No achievements available</p>';
        }

        const allAchievements = this.achievements.ACHIEVEMENTS;
        const unlockedIds = this.playerStats.stats.achievementsUnlocked || [];

        let html = '<div class="space-y-6">';

        // Group by tier
        const tiers = ['gold', 'silver', 'bronze'];
        tiers.forEach(tier => {
            const tierAchievements = allAchievements.filter(a => a.tier === tier);
            const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
            const tierColor = this.achievements.getTierColor(tier);

            html += `
                <div>
                    <h3 class="text-xl font-bold mb-4 ${tierColor}">${tierName} Achievements</h3>
                    <div class="grid md:grid-cols-2 gap-4">
            `;

            tierAchievements.forEach(achievement => {
                const isUnlocked = unlockedIds.includes(achievement.id);
                const progress = this.achievements.getAchievementProgress(achievement.id, this.playerStats.stats);
                
                html += `
                    <div class="bg-gray-50 p-4 rounded-lg border-2 ${isUnlocked ? 'border-green-500 bg-green-50' : 'border-gray-200'} relative">
                        ${isUnlocked ? '<div class="absolute top-2 right-2 text-2xl">✅</div>' : ''}
                        <div class="flex items-start gap-3">
                            <div class="text-3xl">${achievement.icon}</div>
                            <div class="flex-1">
                                <h4 class="font-bold text-lg ${isUnlocked ? 'text-green-700' : 'text-gray-700'}">${achievement.name}</h4>
                                <p class="text-sm text-gray-600 mt-1">${achievement.description}</p>
                                ${!isUnlocked ? `
                                    <div class="mt-2">
                                        <div class="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Progress</span>
                                            <span>${progress}%</span>
                                        </div>
                                        <div class="w-full bg-gray-200 rounded-full h-2">
                                            <div class="bg-blue-600 h-2 rounded-full" style="width: ${progress}%"></div>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });

            html += '</div></div>';
        });

        html += '</div>';
        return html;
    }

    /**
     * Render the leaderboard tab
     */
    renderLeaderboardTab() {
        // Load all player stats from localStorage
        const allStats = this.loadAllPlayerStats();
        
        if (allStats.length === 0) {
            return '<p class="text-center text-gray-500">No leaderboard data available yet. Play some games to see rankings!</p>';
        }

        // Sort by games won
        allStats.sort((a, b) => b.stats.gamesWon - a.stats.gamesWon);

        let html = `
            <div class="space-y-4">
                <div class="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-4 rounded-lg text-center">
                    <h3 class="text-2xl font-bold">🏆 Top Players</h3>
                </div>
                <div class="space-y-2">
        `;

        allStats.forEach((player, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            const winRate = player.stats.gamesPlayed > 0 
                ? ((player.stats.gamesWon / player.stats.gamesPlayed) * 100).toFixed(0) 
                : 0;

            html += `
                <div class="bg-gray-50 p-4 rounded-lg flex items-center gap-4 hover:bg-gray-100 transition">
                    <div class="text-2xl font-bold text-gray-400 w-8">${medal || (index + 1)}</div>
                    <div class="flex-1">
                        <div class="font-bold text-lg">${player.playerName}</div>
                        <div class="text-sm text-gray-600">
                            ${player.stats.gamesWon} wins • ${player.stats.gamesPlayed} games • ${winRate}% win rate
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold text-green-600">${player.stats.gamesWon}</div>
                        <div class="text-xs text-gray-500">Victories</div>
                    </div>
                </div>
            `;
        });

        html += '</div></div>';
        return html;
    }

    /**
     * Load all player stats from localStorage
     */
    loadAllPlayerStats() {
        const allStats = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('monopoly_stats_')) {
                try {
                    const statsData = JSON.parse(localStorage.getItem(key));
                    allStats.push(statsData);
                } catch (e) {
                    console.error('Error loading stats:', e);
                }
            }
        }
        return allStats;
    }

    /**
     * Hide the stats modal
     */
    hide() {
        const modal = document.getElementById('stats-modal');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * Show achievement unlock notification
     */
    showAchievementUnlock(achievement) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-20 right-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-6 rounded-lg shadow-2xl z-50 max-w-sm animate-slide-in';
        notification.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="text-5xl">${achievement.icon}</div>
                <div>
                    <div class="text-sm font-semibold opacity-90">🎉 Achievement Unlocked!</div>
                    <div class="text-xl font-bold">${achievement.name}</div>
                    <div class="text-sm mt-1 opacity-90">${achievement.description}</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slide-out 0.5s ease-out';
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }

    /**
     * Update player stats and check for achievements
     */
    updateStats(eventType, data) {
        if (!this.playerStats) {
            this.init();
        }

        // Update stats based on event type
        switch (eventType) {
            case 'game-ended':
                const won = data.winnerId === data.playerId;
                this.playerStats.recordGame(won, data.duration);
                if (won) this.playerStats.recordWin();
                break;
            
            case 'property-purchased':
                this.playerStats.recordPropertyOwned();
                this.playerStats.recordMoneySpent(data.price);
                break;
            
            case 'house-built':
                this.playerStats.recordHouseBuilt();
                this.playerStats.recordMoneySpent(data.cost);
                break;
            
            case 'hotel-built':
                this.playerStats.recordHotelBuilt();
                this.playerStats.recordMoneySpent(data.cost);
                break;
            
            case 'trade-completed':
                this.playerStats.recordTrade();
                break;
            
            case 'auction-won':
                this.playerStats.recordAuctionWon();
                this.playerStats.recordMoneySpent(data.amount);
                break;
            
            case 'rent-collected':
                this.playerStats.recordRentCollected(data.amount);
                this.playerStats.recordMoneyEarned(data.amount);
                break;
            
            case 'rent-paid':
                this.playerStats.recordRentPaid(data.amount);
                this.playerStats.recordMoneySpent(data.amount);
                break;
            
            case 'player-bankrupt':
                if (data.creditorId === data.playerId) {
                    this.playerStats.recordBankruptcyCaused();
                }
                break;
            
            case 'player-jailed':
                this.playerStats.recordJailVisit();
                break;
        }

        // Check for new achievements
        if (this.achievements) {
            const newAchievements = this.achievements.checkAllAchievements(this.playerStats.stats);
            const currentUnlocked = this.playerStats.stats.achievementsUnlocked || [];
            
            newAchievements.forEach(achievementId => {
                if (!currentUnlocked.includes(achievementId)) {
                    this.playerStats.unlockAchievement(achievementId);
                    const achievement = this.achievements.ACHIEVEMENTS.find(a => a.id === achievementId);
                    if (achievement) {
                        this.showAchievementUnlock(achievement);
                    }
                }
            });
        }

        // Save stats
        this.playerStats.save();
    }
}

// Create global instance
window.statsUI = new StatsUI();

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slide-in {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slide-out {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    .animate-slide-in {
        animation: slide-in 0.5s ease-out;
    }
`;
document.head.appendChild(style);
