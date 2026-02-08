/**
 * Game Model
 * Represents the game state and board
 */

class Game {
    constructor(room) {
        this.roomCode = room.code;
        this.players = room.players;
        this.currentPlayerIndex = 0;
        this.turnNumber = 1;
        this.status = 'active'; // active, paused, finished
        this.startedAt = Date.now();
        this.lastUpdated = Date.now();
        
        // Game state
        this.dice = [0, 0];
        this.doublesCount = 0;
        this.turnActionsCompleted = false;
        
        // Board state - initialize from board definition
        this.board = this.initializeBoard();
        
        // Card decks
        this.chanceCards = this.shuffleCards(this.getChanceCards());
        this.communityChestCards = this.shuffleCards(this.getCommunityChestCards());
        this.chanceCardIndex = 0;
        this.communityChestCardIndex = 0;
        
        // Building inventory
        this.availableHouses = 32;
        this.availableHotels = 12;
        
        // Free Parking jackpot (if enabled)
        this.freeParkingJackpot = 0;
        
        // Game history
        this.history = [];
        this.chatHistory = [];
        
        // Active trades
        this.activeTrades = [];
        
        // Settings from room
        this.settings = room.settings;
    }

    /**
     * Initialize the board with Bangladeshi-themed properties
     */
    initializeBoard() {
        return [
            { index: 0, name: "শুরু (Go)", type: "go" },
            { index: 1, name: "পুরান ঢাকা", price: 600, rent: [20, 100, 300, 900, 1600, 2500], group: "Brown", type: "property", color: "bg-yellow-800", owner: null, mortgaged: false, houses: 0, hotels: 0, buildCost: 500 },
            { index: 2, name: "কমিউনিটি চেস্ট", type: "community-chest" },
            { index: 3, name: "লালবাগ কেল্লা", price: 600, rent: [40, 200, 600, 1800, 3200, 4500], group: "Brown", type: "property", color: "bg-yellow-800", owner: null, mortgaged: false, houses: 0, hotels: 0, buildCost: 500 },
            { index: 4, name: "আয়কর (Income Tax)", type: "tax", amount: 2000 },
            { index: 5, name: "কমলাপুর স্টেশন", price: 2000, rent: [250, 500, 1000, 2000], type: "station", owner: null, mortgaged: false },
            { index: 6, name: "মতিঝিল", price: 1000, rent: [60, 300, 900, 2700, 4000, 5500], group: "LightBlue", type: "property", color: "bg-sky-300", owner: null, mortgaged: false, houses: 0, hotels: 0, buildCost: 500 },
            { index: 7, name: "চান্স", type: "chance" },
            { index: 8, name: "দিলকুশা", price: 1000, rent: [60, 300, 900, 2700, 4000, 5500], group: "LightBlue", type: "property", color: "bg-sky-300", owner: null, mortgaged: false, houses: 0, hotels: 0, buildCost: 500 },
            { index: 9, name: "নয়া পল্টন", price: 1200, rent: [80, 400, 1000, 3000, 4500, 6000], group: "LightBlue", type: "property", color: "bg-sky-300", owner: null, mortgaged: false, houses: 0, hotels: 0, buildCost: 500 },
            { index: 10, name: "জেল (Jail)", type: "jail" },
            { index: 11, name: "ফার্মগেট", price: 1400, rent: [100, 500, 1500, 4500, 6250, 7500], group: "Pink", type: "property", color: "bg-pink-500", owner: null, mortgaged: false, houses: 0, hotels: 0, buildCost: 1000 },
            { index: 12, name: "বিদ্যুৎ সরবরাহ (Electric)", price: 1500, type: "utility", owner: null, mortgaged: false },
            { index: 13, name: "এলিফ্যান্ট রোড", price: 1400, rent: [100, 500, 1500, 4500, 6250, 7500], group: "Pink", type: "property", color: "bg-pink-500", owner: null, mortgaged: false, houses: 0, hotels: 0, buildCost: 1000 },
            { index: 14, name: "নিউ মার্কেট", price: 1600, rent: [120, 600, 1800, 5000, 7000, 9000], group: "Pink", type: "property", color: "bg-pink-500", owner: null, mortgaged: false, houses: 0, hotels: 0, buildCost: 1000 },
            { index: 15, name: "বিমানবন্দর স্টেশন", price: 2000, rent: [250, 500, 1000, 2000], type: "station", owner: null, mortgaged: false },
            { index: 16, name: "ধানমন্ডি", price: 1800, rent: [140, 700, 2000, 5500, 7500, 9500], group: "Orange", type: "property", color: "bg-orange-500", owner: null, mortgaged: false, houses: 0, hotels: 0, buildCost: 1000 },
            { index: 17, name: "কমিউনিটি চেস্ট", type: "community-chest" },
            { index: 18, name: "মোহাম্মদপুর", price: 1800, rent: [140, 700, 2000, 5500, 7500, 9500], group: "Orange", type: "property", color: "bg-orange-500", owner: null, mortgaged: false, houses: 0, hotels: 0, buildCost: 1000 },
            { index: 19, name: "শ্যামলী", price: 2000, rent: [160, 800, 2200, 6000, 8000, 10000], group: "Orange", type: "property", color: "bg-orange-500", owner: null, mortgaged: false, houses: 0, hotels: 0, buildCost: 1000 },
            { index: 20, name: "ফ্রি পার্কিং", type: "free-parking" },
            { index: 21, name: "গুলশান", price: 2200, rent: [180, 900, 2500, 7000, 8750, 10500], group: "Red", type: "property", color: "bg-red-500", owner: null, mortgaged: false, houses: 0, hotels: 0, buildCost: 1500 },
            { index: 22, name: "চান্স", type: "chance" },
            { index: 23, name: "বনানী", price: 2200, rent: [180, 900, 2500, 7000, 8750, 10500], group: "Red", type: "property", color: "bg-red-500", owner: null, mortgaged: false, houses: 0, hotels: 0, buildCost: 1500 },
            { index: 24, name: "বারিধারা", price: 2400, rent: [200, 1000, 3000, 7500, 9250, 11000], group: "Red", type: "property", color: "bg-red-500", owner: null, mortgaged: false, houses: 0, hotels: 0, buildCost: 1500 },
            { index: 25, name: "চট্টগ্রাম স্টেশন", price: 2000, rent: [250, 500, 1000, 2000], type: "station", owner: null, mortgaged: false },
            { index: 26, name: "উত্তরা", price: 2600, rent: [220, 1100, 3300, 8000, 9750, 11500], group: "Yellow", type: "property", color: "bg-yellow-400", owner: null, mortgaged: false, houses: 0, hotels: 0, buildCost: 1500 },
            { index: 27, name: "মিরপুর", price: 2600, rent: [220, 1100, 3300, 8000, 9750, 11500], group: "Yellow", type: "property", color: "bg-yellow-400", owner: null, mortgaged: false, houses: 0, hotels: 0, buildCost: 1500 },
            { index: 28, name: "পানি সরবরাহ (Water Works)", price: 1500, type: "utility", owner: null, mortgaged: false },
            { index: 29, name: "বসুন্ধরা", price: 2800, rent: [240, 1200, 3600, 8500, 10250, 12000], group: "Yellow", type: "property", color: "bg-yellow-400", owner: null, mortgaged: false, houses: 0, hotels: 0, buildCost: 1500 },
            { index: 30, name: "জেলে যাও (Go to Jail)", type: "go-to-jail" },
            { index: 31, name: "কক্সবাজার", price: 3000, rent: [260, 1300, 3900, 9000, 11000, 13000], group: "Green", type: "property", color: "bg-green-600", owner: null, mortgaged: false, houses: 0, hotels: 0, buildCost: 2000 },
            { index: 32, name: "সেন্ট মার্টিন", price: 3000, rent: [260, 1300, 3900, 9000, 11000, 13000], group: "Green", type: "property", color: "bg-green-600", owner: null, mortgaged: false, houses: 0, hotels: 0, buildCost: 2000 },
            { index: 33, name: "কমিউনিটি চেস্ট", type: "community-chest" },
            { index: 34, name: "বান্দরবান", price: 3200, rent: [280, 1500, 4500, 10000, 12000, 14000], group: "Green", type: "property", color: "bg-green-600", owner: null, mortgaged: false, houses: 0, hotels: 0, buildCost: 2000 },
            { index: 35, name: "সিলেট স্টেশন", price: 2000, rent: [250, 500, 1000, 2000], type: "station", owner: null, mortgaged: false },
            { index: 36, name: "চান্স", type: "chance" },
            { index: 37, name: "শ্রীমঙ্গল", price: 3500, rent: [350, 1750, 5000, 11000, 13000, 15000], group: "DarkBlue", type: "property", color: "bg-blue-800", owner: null, mortgaged: false, houses: 0, hotels: 0, buildCost: 2000 },
            { index: 38, name: "বিলাস কর (Luxury Tax)", type: "tax", amount: 1000 },
            { index: 39, name: "জাফলং", price: 4000, rent: [500, 2000, 6000, 14000, 17000, 20000], group: "DarkBlue", type: "property", color: "bg-blue-800", owner: null, mortgaged: false, houses: 0, hotels: 0, buildCost: 2000 },
        ];
    }

    /**
     * Get Chance card definitions
     */
    getChanceCards() {
        return [
            { text: "Advance to Go (Collect ৳2000).", action: "move_to", spaceIndex: 0, collectGo: true },
            { text: "Advance to মতিঝিল.", action: "move_to", spaceIndex: 6 },
            { text: "Advance token to nearest Utility.", action: "move_to_nearest", type: "utility" },
            { text: "Advance token to the nearest Station.", action: "move_to_nearest", type: "station", rentMultiplier: 2 },
            { text: "Bank pays you dividend of ৳500.", action: "add_money", amount: 500 },
            { text: "Get Out of Jail Free card.", action: "get_out_of_jail_free" },
            { text: "Go Back 3 Spaces.", action: "move_relative", steps: -3 },
            { text: "Go to Jail.", action: "go_to_jail" },
            { text: "Make general repairs on all your property. For each house pay ৳250, for each hotel ৳1000.", action: "repairs", houseCost: 250, hotelCost: 1000 },
            { text: "Pay poor tax of ৳150.", action: "remove_money", amount: 150 },
            { text: "Take a trip to কমলাপুর Station.", action: "move_to", spaceIndex: 5, collectGo: true },
            { text: "Advance to জাফলং.", action: "move_to", spaceIndex: 39 },
            { text: "You have been elected Chairman of the Board. Pay each player ৳500.", action: "pay_players", amount: 500 },
            { text: "Your building loan matures. Collect ৳1500.", action: "add_money", amount: 1500 },
        ];
    }

    /**
     * Get Community Chest card definitions
     */
    getCommunityChestCards() {
        return [
            { text: "Advance to Go (Collect ৳2000).", action: "move_to", spaceIndex: 0, collectGo: true },
            { text: "Bank error in your favor. Collect ৳2000.", action: "add_money", amount: 2000 },
            { text: "Doctor's fee. Pay ৳500.", action: "remove_money", amount: 500 },
            { text: "From sale of stock you get ৳500.", action: "add_money", amount: 500 },
            { text: "Get Out of Jail Free card.", action: "get_out_of_jail_free" },
            { text: "Go to Jail.", action: "go_to_jail" },
            { text: "Holiday fund matures. Receive ৳1000.", action: "add_money", amount: 1000 },
            { text: "Income tax refund. Collect ৳200.", action: "add_money", amount: 200 },
            { text: "It is your birthday. Collect ৳100 from every player.", action: "collect_from_players", amount: 100 },
            { text: "Life insurance matures. Collect ৳1000.", action: "add_money", amount: 1000 },
            { text: "Pay hospital fees of ৳1000.", action: "remove_money", amount: 1000 },
            { text: "Pay school fees of ৳500.", action: "remove_money", amount: 500 },
            { text: "Receive ৳250 consultancy fee.", action: "add_money", amount: 250 },
            { text: "You are assessed for street repairs. ৳400 per house, ৳1150 per hotel.", action: "repairs", houseCost: 400, hotelCost: 1150 },
            { text: "You have won second prize in a beauty contest. Collect ৳100.", action: "add_money", amount: 100 },
            { text: "You inherit ৳1000.", action: "add_money", amount: 1000 },
        ];
    }

    /**
     * Shuffle card deck
     */
    shuffleCards(cards) {
        const shuffled = [...cards];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Get current player
     */
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    /**
     * Roll dice (server-side for anti-cheat)
     */
    rollDice() {
        this.dice = [
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1
        ];
        
        const isDoubles = this.dice[0] === this.dice[1];
        if (isDoubles) {
            this.doublesCount++;
        } else {
            this.doublesCount = 0;
        }
        
        return { dice: this.dice, isDoubles, doublesCount: this.doublesCount };
    }

    /**
     * Next turn
     */
    nextTurn() {
        this.dice = [0, 0]; // Reset dice for the new turn
        this.doublesCount = 0;
        this.turnActionsCompleted = false;
        
        // Skip bankrupt players
        do {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        } while (this.players[this.currentPlayerIndex].isBankrupt);
        
        this.turnNumber++;
        this.lastUpdated = Date.now();
    }

    /**
     * Calculate rent for a property
     */
    calculateRent(property, diceRoll = 0) {
        if (property.mortgaged) return 0;
        
        if (property.type === 'utility') {
            // Count owned utilities
            const ownedUtilities = this.board.filter(p => p.type === 'utility' && p.owner === property.owner).length;
            const multiplier = ownedUtilities === 2 ? 10 : 4;
            return diceRoll * multiplier;
        }
        
        if (property.type === 'station') {
            // Count owned stations
            const ownedStations = this.board.filter(p => p.type === 'station' && p.owner === property.owner).length;
            return property.rent[ownedStations - 1] || property.rent[0];
        }
        
        if (property.type === 'property') {
            // Check if owner has monopoly
            const groupProperties = this.board.filter(p => p.group === property.group && p.type === 'property');
            const hasMonopoly = groupProperties.every(p => p.owner === property.owner);
            
            if (property.hotels > 0) {
                return property.rent[5]; // Hotel rent
            } else if (property.houses > 0) {
                return property.rent[property.houses]; // House rent (1-4)
            } else if (hasMonopoly) {
                return property.rent[0] * 2; // Double rent for monopoly
            } else {
                return property.rent[0]; // Base rent
            }
        }
        
        return 0;
    }

    /**
     * Add history entry
     */
    addHistory(entry) {
        this.history.push({
            ...entry,
            timestamp: Date.now(),
            turnNumber: this.turnNumber
        });
    }

    /**
     * Add chat message
     */
    addChatMessage(playerId, message) {
        this.chatHistory.push({
            playerId,
            message,
            timestamp: Date.now()
        });
    }

    /**
     * Draw a Chance card
     * @returns {Object} Card object and effects
     */
    drawChanceCard() {
        const card = this.chanceCards[this.chanceCardIndex];
        this.chanceCardIndex = (this.chanceCardIndex + 1) % this.chanceCards.length;
        
        // Reshuffle when we've gone through all cards
        if (this.chanceCardIndex === 0) {
            this.chanceCards = this.shuffleCards(this.chanceCards);
        }
        
        return card;
    }

    /**
     * Draw a Community Chest card
     * @returns {Object} Card object and effects
     */
    drawCommunityChestCard() {
        const card = this.communityChestCards[this.communityChestCardIndex];
        this.communityChestCardIndex = (this.communityChestCardIndex + 1) % this.communityChestCards.length;
        
        // Reshuffle when we've gone through all cards
        if (this.communityChestCardIndex === 0) {
            this.communityChestCards = this.shuffleCards(this.communityChestCards);
        }
        
        return card;
    }

    /**
     * Execute card action and return result
     * @param {Object} player - The player who drew the card
     * @param {Object} card - The card to execute
     * @returns {Object} Result with action taken and any additional data
     */
    executeCardAction(player, card) {
        const result = {
            action: card.action,
            message: '',
            requiresMovement: false,
            newPosition: null,
            moneyChange: 0
        };

        switch (card.action) {
            case 'add_money':
                player.money += card.amount;
                result.message = `${player.name} received ৳${card.amount}.`;
                result.moneyChange = card.amount;
                break;

            case 'remove_money':
                const amountToPay = Math.min(player.money, card.amount);
                player.money -= amountToPay;
                result.message = `${player.name} paid ৳${amountToPay}.`;
                result.moneyChange = -amountToPay;
                if (player.money < card.amount) {
                    result.message += ` (Could not afford full amount of ৳${card.amount})`;
                }
                break;

            case 'move_to':
                const oldPos = player.position;
                player.position = card.spaceIndex;
                result.requiresMovement = true;
                result.newPosition = card.spaceIndex;
                result.message = `${player.name} moved to ${this.board[card.spaceIndex]?.name || 'space ' + card.spaceIndex}.`;
                
                // Check if passed Go
                if (card.collectGo && player.position < oldPos) {
                    const goSalary = this.settings.goSalary || 2000;
                    player.money += goSalary;
                    result.message += ` Passed Go and collected ৳${goSalary}.`;
                    result.moneyChange = goSalary;
                }
                break;

            case 'move_relative':
                const currentPos = player.position;
                const steps = card.steps || 0;
                player.position = (currentPos + steps + this.board.length) % this.board.length;
                result.requiresMovement = true;
                result.newPosition = player.position;
                result.message = `${player.name} moved ${Math.abs(steps)} spaces ${steps > 0 ? 'forward' : 'backward'} to ${this.board[player.position]?.name || 'space ' + player.position}.`;
                break;

            case 'go_to_jail':
                player.position = 10; // Jail position
                player.inJail = true;
                player.jailTurns = 0;
                result.message = `${player.name} goes to Jail!`;
                result.requiresMovement = true;
                result.newPosition = 10;
                break;

            case 'get_out_of_jail_free':
                player.getOutOfJailFreeCards = (player.getOutOfJailFreeCards || 0) + 1;
                result.message = `${player.name} received a 'Get Out of Jail Free' card.`;
                break;

            case 'pay_players':
                const otherPlayers = this.players.filter(p => p.id !== player.id && !p.bankrupt);
                const totalRequired = card.amount * otherPlayers.length;
                
                if (player.money >= totalRequired) {
                    otherPlayers.forEach(otherPlayer => {
                        player.money -= card.amount;
                        otherPlayer.money += card.amount;
                    });
                    result.message = `${player.name} paid ৳${card.amount} to each player (Total: ৳${totalRequired}).`;
                    result.moneyChange = -totalRequired;
                } else {
                    result.message = `${player.name} cannot afford to pay ৳${totalRequired}!`;
                }
                break;

            case 'collect_from_players':
                let totalCollected = 0;
                this.players.forEach(otherPlayer => {
                    if (otherPlayer.id !== player.id && !otherPlayer.bankrupt) {
                        const amountToCollect = Math.min(otherPlayer.money, card.amount);
                        otherPlayer.money -= amountToCollect;
                        player.money += amountToCollect;
                        totalCollected += amountToCollect;
                    }
                });
                result.message = `${player.name} collected ৳${totalCollected} from other players.`;
                result.moneyChange = totalCollected;
                break;

            case 'move_to_nearest':
                // Find nearest space of specified type
                let nearestIndex = -1;
                let minDistance = this.board.length;
                const currentPosition = player.position;
                
                for (let i = 0; i < this.board.length; i++) {
                    if (this.board[i].type === card.type) {
                        let distance = (i - currentPosition + this.board.length) % this.board.length;
                        if (distance === 0) distance = this.board.length;
                        if (distance < minDistance) {
                            minDistance = distance;
                            nearestIndex = i;
                        }
                    }
                }
                
                if (nearestIndex !== -1) {
                    const oldPosNearest = player.position;
                    player.position = nearestIndex;
                    result.requiresMovement = true;
                    result.newPosition = nearestIndex;
                    result.message = `${player.name} moved to nearest ${card.type}: ${this.board[nearestIndex].name}.`;
                    
                    // Check if passed Go
                    if (player.position < oldPosNearest) {
                        const goSalary = this.settings.goSalary || 2000;
                        player.money += goSalary;
                        result.message += ` Passed Go and collected ৳${goSalary}.`;
                        result.moneyChange = goSalary;
                    }
                    
                    // Store rent multiplier for later processing
                    result.rentMultiplier = card.rentMultiplier || 1;
                }
                break;

            case 'repairs':
                let totalCost = 0;
                this.board.forEach(space => {
                    if (space.owner === player.id) {
                        if (space.houses) {
                            totalCost += space.houses * card.houseCost;
                        }
                        if (space.hotels) {
                            totalCost += space.hotels * card.hotelCost;
                        }
                    }
                });
                const repairsPaid = Math.min(player.money, totalCost);
                player.money -= repairsPaid;
                result.message = `${player.name} paid ৳${repairsPaid} for repairs.`;
                result.moneyChange = -repairsPaid;
                if (repairsPaid < totalCost) {
                    result.message += ` (Could not afford full amount of ৳${totalCost})`;
                }
                break;

            default:
                result.message = `Unknown card action: ${card.action}`;
        }

        return result;
    }

    /**
     * Serialize game state for client
     */
    toJSON() {
        return {
            roomCode: this.roomCode,
            players: this.players.map(p => p.toJSON()),
            currentPlayerIndex: this.currentPlayerIndex,
            turnNumber: this.turnNumber,
            status: this.status,
            startedAt: this.startedAt,
            dice: this.dice,
            doublesCount: this.doublesCount,
            board: this.board,
            availableHouses: this.availableHouses,
            availableHotels: this.availableHotels,
            freeParkingJackpot: this.freeParkingJackpot,
            settings: this.settings
        };
    }
}

module.exports = Game;
