/**
 * Player Statistics Model
 * Tracks player performance and achievements
 */

class PlayerStats {
    constructor(playerName, playerId = null) {
        this.playerId = playerId;
        this.playerName = playerName;
        this.stats = {
            gamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0,
            totalMoneyEarned: 0,
            totalMoneySpent: 0,
            highestMoney: 0,
            propertiesOwned: 0,
            maxPropertiesOwned: 0,
            housesBuilt: 0,
            hotelsBuilt: 0,
            tradesCompleted: 0,
            auctionsWon: 0,
            rentCollected: 0,
            rentPaid: 0,
            bankruptciesCaused: 0,
            timesInJail: 0,
            doublesRolled: 0,
            totalPlayTime: 0, // in seconds
            longestGame: 0,
            shortestWin: 0,
            achievements: []
        };
        this.createdAt = Date.now();
        this.updatedAt = Date.now();
    }

    /**
     * Update game played
     */
    recordGamePlayed(won, duration) {
        this.stats.gamesPlayed++;
        if (won) {
            this.stats.gamesWon++;
            if (this.stats.shortestWin === 0 || duration < this.stats.shortestWin) {
                this.stats.shortestWin = duration;
            }
        } else {
            this.stats.gamesLost++;
        }
        
        if (duration > this.stats.longestGame) {
            this.stats.longestGame = duration;
        }
        
        this.stats.totalPlayTime += duration;
        this.updatedAt = Date.now();
    }

    /**
     * Record money earned
     */
    recordMoneyEarned(amount) {
        this.stats.totalMoneyEarned += amount;
        this.updatedAt = Date.now();
    }

    /**
     * Record money spent
     */
    recordMoneySpent(amount) {
        this.stats.totalMoneySpent += amount;
        this.updatedAt = Date.now();
    }

    /**
     * Update highest money
     */
    updateHighestMoney(currentMoney) {
        if (currentMoney > this.stats.highestMoney) {
            this.stats.highestMoney = currentMoney;
            this.updatedAt = Date.now();
        }
    }

    /**
     * Record property acquired
     */
    recordPropertyAcquired() {
        this.stats.propertiesOwned++;
        if (this.stats.propertiesOwned > this.stats.maxPropertiesOwned) {
            this.stats.maxPropertiesOwned = this.stats.propertiesOwned;
        }
        this.updatedAt = Date.now();
    }

    /**
     * Record building constructed
     */
    recordBuildingConstructed(isHotel) {
        if (isHotel) {
            this.stats.hotelsBuilt++;
        } else {
            this.stats.housesBuilt++;
        }
        this.updatedAt = Date.now();
    }

    /**
     * Record trade completed
     */
    recordTradeCompleted() {
        this.stats.tradesCompleted++;
        this.updatedAt = Date.now();
    }

    /**
     * Record auction won
     */
    recordAuctionWon() {
        this.stats.auctionsWon++;
        this.updatedAt = Date.now();
    }

    /**
     * Record rent collected
     */
    recordRentCollected(amount) {
        this.stats.rentCollected += amount;
        this.updatedAt = Date.now();
    }

    /**
     * Record rent paid
     */
    recordRentPaid(amount) {
        this.stats.rentPaid += amount;
        this.updatedAt = Date.now();
    }

    /**
     * Record bankruptcy caused
     */
    recordBankruptcyCaused() {
        this.stats.bankruptciesCaused++;
        this.updatedAt = Date.now();
    }

    /**
     * Record jail time
     */
    recordJailTime() {
        this.stats.timesInJail++;
        this.updatedAt = Date.now();
    }

    /**
     * Record doubles rolled
     */
    recordDoublesRolled() {
        this.stats.doublesRolled++;
        this.updatedAt = Date.now();
    }

    /**
     * Add achievement
     */
    addAchievement(achievementId) {
        if (!this.stats.achievements.includes(achievementId)) {
            this.stats.achievements.push(achievementId);
            this.updatedAt = Date.now();
            return true;
        }
        return false;
    }

    /**
     * Get win rate
     */
    getWinRate() {
        if (this.stats.gamesPlayed === 0) return 0;
        return (this.stats.gamesWon / this.stats.gamesPlayed * 100).toFixed(1);
    }

    /**
     * Get average game duration
     */
    getAverageGameDuration() {
        if (this.stats.gamesPlayed === 0) return 0;
        return Math.floor(this.stats.totalPlayTime / this.stats.gamesPlayed);
    }

    /**
     * Get net worth (money earned - money spent)
     */
    getNetWorth() {
        return this.stats.totalMoneyEarned - this.stats.totalMoneySpent;
    }

    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            playerId: this.playerId,
            playerName: this.playerName,
            stats: this.stats,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Load from JSON
     */
    static fromJSON(data) {
        const playerStats = new PlayerStats(data.playerName, data.playerId);
        playerStats.stats = data.stats;
        playerStats.createdAt = data.createdAt;
        playerStats.updatedAt = data.updatedAt;
        return playerStats;
    }

    /**
     * Save to localStorage
     */
    save() {
        try {
            const key = `monopoly_stats_${this.playerName}`;
            localStorage.setItem(key, JSON.stringify(this.toJSON()));
            return true;
        } catch (error) {
            console.error('Error saving player stats:', error);
            return false;
        }
    }

    /**
     * Load from localStorage
     */
    static load(playerName) {
        try {
            const key = `monopoly_stats_${playerName}`;
            const data = localStorage.getItem(key);
            if (data) {
                return PlayerStats.fromJSON(JSON.parse(data));
            }
            return new PlayerStats(playerName);
        } catch (error) {
            console.error('Error loading player stats:', error);
            return new PlayerStats(playerName);
        }
    }

    /**
     * List all player stats
     */
    static listAll() {
        const allStats = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            
            if (key && key.startsWith('monopoly_stats_')) {
                try {
                    const data = localStorage.getItem(key);
                    if (data) {
                        const stats = PlayerStats.fromJSON(JSON.parse(data));
                        allStats.push(stats);
                    }
                } catch (error) {
                    console.error('Error parsing player stats:', error);
                }
            }
        }
        
        return allStats;
    }
}

// Make PlayerStats available globally
if (typeof window !== 'undefined') {
    window.PlayerStats = PlayerStats;
}

// For Node.js (server-side)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerStats;
}
