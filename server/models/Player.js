/**
 * Player Model
 * Represents a player in the game
 */

class Player {
    constructor(id, name, socketId) {
        this.id = id;
        this.name = name;
        this.socketId = socketId;
        this.money = 15000; // Starting money
        this.position = 0; // Board position (0-39)
        this.properties = []; // Array of property indices
        this.isInJail = false;
        this.jailTurns = 0;
        this.getOutOfJailFreeCards = 0;
        this.isBankrupt = false;
        this.isReady = false;
        this.isHost = false;
        this.color = null; // Player color
        this.token = null; // Player token emoji
        this.lastActive = Date.now();
        this.disconnected = false;
    }

    /**
     * Add money to player
     */
    addMoney(amount) {
        this.money += amount;
        return this.money;
    }

    /**
     * Remove money from player
     */
    removeMoney(amount) {
        this.money -= amount;
        if (this.money < 0) {
            this.money = 0;
        }
        return this.money;
    }

    /**
     * Move player to a specific position
     */
    moveTo(position, collectGo = false) {
        const oldPosition = this.position;
        this.position = position;
        
        // Check if passed Go
        if (collectGo && position < oldPosition) {
            this.addMoney(2000); // GO salary
            return { passedGo: true };
        }
        
        return { passedGo: false };
    }

    /**
     * Move player relative to current position
     */
    moveBy(steps) {
        const newPosition = (this.position + steps) % 40;
        const passedGo = steps > 0 && newPosition < this.position;
        
        this.position = newPosition < 0 ? 40 + newPosition : newPosition;
        
        if (passedGo) {
            this.addMoney(2000);
        }
        
        return { passedGo };
    }

    /**
     * Send player to jail
     */
    goToJail() {
        this.position = 10; // Jail position
        this.isInJail = true;
        this.jailTurns = 0;
    }

    /**
     * Release player from jail
     */
    releaseFromJail() {
        this.isInJail = false;
        this.jailTurns = 0;
    }

    /**
     * Add property to player's portfolio
     */
    addProperty(propertyIndex) {
        if (!this.properties.includes(propertyIndex)) {
            this.properties.push(propertyIndex);
        }
    }

    /**
     * Remove property from player's portfolio
     */
    removeProperty(propertyIndex) {
        const index = this.properties.indexOf(propertyIndex);
        if (index > -1) {
            this.properties.splice(index, 1);
        }
    }

    /**
     * Mark player as bankrupt
     */
    declareBankruptcy() {
        this.isBankrupt = true;
        this.money = 0;
    }

    /**
     * Update last active timestamp
     */
    updateActivity() {
        this.lastActive = Date.now();
    }

    /**
     * Serialize player data for client
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            money: this.money,
            position: this.position,
            properties: this.properties,
            isInJail: this.isInJail,
            jailTurns: this.jailTurns,
            getOutOfJailFreeCards: this.getOutOfJailFreeCards,
            isBankrupt: this.isBankrupt,
            isReady: this.isReady,
            isHost: this.isHost,
            color: this.color,
            token: this.token,
            disconnected: this.disconnected
        };
    }
}

module.exports = Player;
