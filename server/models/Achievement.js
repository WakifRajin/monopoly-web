/**
 * Achievement System
 * Defines and manages player achievements
 */

class Achievement {
    /**
     * List of all achievements
     */
    static ACHIEVEMENTS = [
        {
            id: 'first_win',
            name: 'First Victory',
            description: 'Win your first game',
            icon: '🏆',
            tier: 'bronze',
            condition: (stats) => stats.gamesWon >= 1
        },
        {
            id: 'monopolist',
            name: 'Monopolist',
            description: 'Own 3 monopolies in one game',
            icon: '🏘️',
            tier: 'gold',
            condition: (stats, gameData) => {
                // This would need game data to check
                return false; // Implement in game logic
            }
        },
        {
            id: 'property_tycoon',
            name: 'Property Tycoon',
            description: 'Own 10+ properties',
            icon: '🏢',
            tier: 'silver',
            condition: (stats) => stats.maxPropertiesOwned >= 10
        },
        {
            id: 'hotel_mogul',
            name: 'Hotel Mogul',
            description: 'Build 5 hotels in one game',
            icon: '🏨',
            tier: 'gold',
            condition: (stats) => stats.hotelsBuilt >= 5
        },
        {
            id: 'master_trader',
            name: 'Master Trader',
            description: 'Complete 5 trades in one game',
            icon: '🤝',
            tier: 'silver',
            condition: (stats) => stats.tradesCompleted >= 5
        },
        {
            id: 'lucky_seven',
            name: 'Lucky Seven',
            description: 'Roll doubles 3 times in a row',
            icon: '🎲',
            tier: 'gold',
            condition: (stats, gameData) => {
                // This would need game data to check
                return false; // Implement in game logic
            }
        },
        {
            id: 'survivor',
            name: 'Survivor',
            description: 'Win with less than ৳500',
            icon: '💪',
            tier: 'gold',
            condition: (stats, gameData) => {
                // This would need game data to check
                return false; // Implement in game logic
            }
        },
        {
            id: 'speed_runner',
            name: 'Speed Runner',
            description: 'Win in under 30 minutes',
            icon: '⚡',
            tier: 'gold',
            condition: (stats) => stats.shortestWin > 0 && stats.shortestWin < 1800
        },
        {
            id: 'bank_breaker',
            name: 'Bank Breaker',
            description: 'Have over ৳50,000',
            icon: '💰',
            tier: 'gold',
            condition: (stats) => stats.highestMoney >= 50000
        },
        {
            id: 'rent_collector',
            name: 'Rent Collector',
            description: 'Collect ৳10,000 in rent',
            icon: '💵',
            tier: 'silver',
            condition: (stats) => stats.rentCollected >= 10000
        },
        {
            id: 'veteran_player',
            name: 'Veteran Player',
            description: 'Play 10 games',
            icon: '🎮',
            tier: 'bronze',
            condition: (stats) => stats.gamesPlayed >= 10
        },
        {
            id: 'consistent_winner',
            name: 'Consistent Winner',
            description: 'Win 5 games',
            icon: '🏅',
            tier: 'silver',
            condition: (stats) => stats.gamesWon >= 5
        },
        {
            id: 'champion',
            name: 'Champion',
            description: 'Win 10 games',
            icon: '👑',
            tier: 'gold',
            condition: (stats) => stats.gamesWon >= 10
        },
        {
            id: 'building_expert',
            name: 'Building Expert',
            description: 'Build 20 houses total',
            icon: '🏠',
            tier: 'bronze',
            condition: (stats) => stats.housesBuilt >= 20
        },
        {
            id: 'auction_winner',
            name: 'Auction Winner',
            description: 'Win 5 auctions',
            icon: '🔨',
            tier: 'bronze',
            condition: (stats) => stats.auctionsWon >= 5
        },
        {
            id: 'negotiator',
            name: 'Negotiator',
            description: 'Complete 10 trades total',
            icon: '🤵',
            tier: 'bronze',
            condition: (stats) => stats.tradesCompleted >= 10
        },
        {
            id: 'jail_bird',
            name: 'Jail Bird',
            description: 'Go to jail 10 times',
            icon: '👮',
            tier: 'bronze',
            condition: (stats) => stats.timesInJail >= 10
        },
        {
            id: 'bankruptcy_king',
            name: 'Bankruptcy King',
            description: 'Cause 3 bankruptcies',
            icon: '💀',
            tier: 'silver',
            condition: (stats) => stats.bankruptciesCaused >= 3
        },
        {
            id: 'marathon_player',
            name: 'Marathon Player',
            description: 'Play for 10 hours total',
            icon: '⏱️',
            tier: 'silver',
            condition: (stats) => stats.totalPlayTime >= 36000
        },
        {
            id: 'money_maker',
            name: 'Money Maker',
            description: 'Earn ৳100,000 total',
            icon: '💸',
            tier: 'gold',
            condition: (stats) => stats.totalMoneyEarned >= 100000
        }
    ];

    /**
     * Get achievement by ID
     */
    static getAchievement(id) {
        return this.ACHIEVEMENTS.find(a => a.id === id);
    }

    /**
     * Get all achievements
     */
    static getAllAchievements() {
        return this.ACHIEVEMENTS;
    }

    /**
     * Get achievements by tier
     */
    static getAchievementsByTier(tier) {
        return this.ACHIEVEMENTS.filter(a => a.tier === tier);
    }

    /**
     * Check if player has unlocked achievement
     */
    static checkAchievement(achievementId, stats, gameData = null) {
        const achievement = this.getAchievement(achievementId);
        if (!achievement) return false;
        
        return achievement.condition(stats, gameData);
    }

    /**
     * Check all achievements for a player
     */
    static checkAllAchievements(stats, gameData = null) {
        const newAchievements = [];
        
        this.ACHIEVEMENTS.forEach(achievement => {
            // Skip if already unlocked
            if (stats.achievements.includes(achievement.id)) {
                return;
            }
            
            // Check condition
            if (achievement.condition(stats, gameData)) {
                newAchievements.push(achievement);
            }
        });
        
        return newAchievements;
    }

    /**
     * Get achievement progress
     */
    static getAchievementProgress(achievementId, stats) {
        const achievement = this.getAchievement(achievementId);
        if (!achievement) return 0;
        
        // Calculate progress based on achievement type
        switch (achievementId) {
            case 'first_win':
            case 'veteran_player':
                return Math.min(100, (stats.gamesPlayed / 10) * 100);
            
            case 'property_tycoon':
                return Math.min(100, (stats.maxPropertiesOwned / 10) * 100);
            
            case 'hotel_mogul':
                return Math.min(100, (stats.hotelsBuilt / 5) * 100);
            
            case 'master_trader':
            case 'negotiator':
                return Math.min(100, (stats.tradesCompleted / 10) * 100);
            
            case 'rent_collector':
                return Math.min(100, (stats.rentCollected / 10000) * 100);
            
            case 'bank_breaker':
                return Math.min(100, (stats.highestMoney / 50000) * 100);
            
            case 'consistent_winner':
                return Math.min(100, (stats.gamesWon / 5) * 100);
            
            case 'champion':
                return Math.min(100, (stats.gamesWon / 10) * 100);
            
            case 'building_expert':
                return Math.min(100, (stats.housesBuilt / 20) * 100);
            
            case 'auction_winner':
                return Math.min(100, (stats.auctionsWon / 5) * 100);
            
            case 'jail_bird':
                return Math.min(100, (stats.timesInJail / 10) * 100);
            
            case 'bankruptcy_king':
                return Math.min(100, (stats.bankruptciesCaused / 3) * 100);
            
            case 'marathon_player':
                return Math.min(100, (stats.totalPlayTime / 36000) * 100);
            
            case 'money_maker':
                return Math.min(100, (stats.totalMoneyEarned / 100000) * 100);
            
            case 'speed_runner':
                if (stats.shortestWin === 0) return 0;
                return Math.min(100, 100 - ((stats.shortestWin / 1800) * 100));
            
            default:
                return 0;
        }
    }

    /**
     * Get tier color
     */
    static getTierColor(tier) {
        const colors = {
            bronze: '#CD7F32',
            silver: '#C0C0C0',
            gold: '#FFD700'
        };
        return colors[tier] || '#808080'; // Default to gray hex color
    }

    /**
     * Get tier display name
     */
    static getTierDisplayName(tier) {
        return tier.charAt(0).toUpperCase() + tier.slice(1);
    }

    /**
     * Calculate player's achievement score
     */
    static calculateAchievementScore(stats) {
        let score = 0;
        const tierPoints = {
            bronze: 10,
            silver: 25,
            gold: 50
        };
        
        stats.achievements.forEach(achievementId => {
            const achievement = this.getAchievement(achievementId);
            if (achievement) {
                score += tierPoints[achievement.tier] || 0;
            }
        });
        
        return score;
    }
}

// Make Achievement available globally
if (typeof window !== 'undefined') {
    window.Achievement = Achievement;
}

// For Node.js (server-side)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Achievement;
}
