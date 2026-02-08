/**
 * Game Controller
 * Handles game logic and state management
 */

const Game = require('../models/Game');
const GameState = require('../models/GameState');
const logger = require('../utils/logger');
const {
    validatePropertyPurchase,
    validateBuildingPurchase,
    validateMortgage,
    validateUnmortgage,
    validateTradeOffer
} = require('../utils/validators');

class GameController {
    constructor() {
        this.games = new Map(); // roomCode -> Game
        this.autoSaveInterval = 60000; // Auto-save every 60 seconds
        this.autoSaveTimer = null;
        this.setupAutoSave();
    }

    /**
     * Setup auto-save timer
     */
    setupAutoSave() {
        // Clear existing timer if any
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setInterval(() => {
            this.games.forEach((game, roomCode) => {
                if (game.status === 'active') {
                    try {
                        this.saveGame(roomCode);
                    } catch (error) {
                        logger.error(`Auto-save failed for room ${roomCode}:`, error.message);
                    }
                }
            });
        }, this.autoSaveInterval);
    }

    /**
     * Cleanup and stop auto-save timer
     */
    destroy() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    /**
     * Start a new game from a room
     */
    startGame(room) {
        if (room.status !== 'waiting') {
            throw new Error('Game has already started');
        }

        if (!room.areAllPlayersReady()) {
            throw new Error('Not all players are ready');
        }

        room.startGame();
        const game = new Game(room);
        this.games.set(room.code, game);

        logger.info(`Game started in room ${room.code} with ${game.players.length} players`);
        return game;
    }

    /**
     * Get game by room code
     */
    getGame(roomCode) {
        return this.games.get(roomCode);
    }

    /**
     * Handle dice roll
     */
    rollDice(roomCode) {
        const game = this.getGame(roomCode);
        if (!game) {
            throw new Error('Game not found');
        }

        const currentPlayer = game.getCurrentPlayer();
        if (currentPlayer.isInJail) {
            // Handle jail logic
            const result = game.rollDice();
            if (result.isDoubles) {
                currentPlayer.releaseFromJail();
                currentPlayer.moveBy(result.dice[0] + result.dice[1]);
                game.addHistory({
                    type: 'jail_release',
                    playerId: currentPlayer.id,
                    method: 'doubles'
                });
            } else {
                currentPlayer.jailTurns++;
                if (currentPlayer.jailTurns >= 3) {
                    // Force pay fine
                    currentPlayer.removeMoney(game.settings.jailFine);
                    currentPlayer.releaseFromJail();
                    currentPlayer.moveBy(result.dice[0] + result.dice[1]);
                    game.addHistory({
                        type: 'jail_release',
                        playerId: currentPlayer.id,
                        method: 'forced_payment',
                        amount: game.settings.jailFine
                    });
                } else {
                    game.addHistory({
                        type: 'jail_attempt',
                        playerId: currentPlayer.id,
                        attempt: currentPlayer.jailTurns
                    });
                }
            }
            return result;
        }

        // Normal dice roll
        const result = game.rollDice();
        
        // Check for three doubles (go to jail)
        if (result.doublesCount >= 3) {
            currentPlayer.goToJail();
            game.doublesCount = 0;
            game.addHistory({
                type: 'go_to_jail',
                playerId: currentPlayer.id,
                reason: 'three_doubles'
            });
            return { ...result, goToJail: true };
        }

        // Move player
        const moveResult = currentPlayer.moveBy(result.dice[0] + result.dice[1]);
        
        game.addHistory({
            type: 'dice_roll',
            playerId: currentPlayer.id,
            dice: result.dice,
            position: currentPlayer.position,
            passedGo: moveResult.passedGo
        });

        return { ...result, newPosition: currentPlayer.position, passedGo: moveResult.passedGo };
    }

    /**
     * Process landing on a space after dice roll or card movement
     * @param {string} roomCode - Room code
     * @param {string} playerId - Player ID
     * @param {number} diceTotal - Total dice roll (for utility rent)
     * @returns {Object} Landing result with action type and details
     */
    processLanding(roomCode, playerId, diceTotal = 0) {
        const game = this.getGame(roomCode);
        if (!game) {
            throw new Error('Game not found');
        }

        const player = game.players.find(p => p.id === playerId);
        if (!player) {
            throw new Error('Player not found');
        }

        const space = game.board[player.position];
        if (!space) {
            return { action: 'none' };
        }

        const result = {
            action: space.type,
            space: space,
            playerId: player.id,
            position: player.position
        };

        switch (space.type) {
            case 'property':
            case 'station':
            case 'utility':
                if (space.owner === null || space.owner === undefined) {
                    // Unowned property - offer to buy
                    result.action = 'property-available';
                    result.propertyName = space.name;
                    result.propertyPrice = space.price;
                } else if (space.owner !== player.id) {
                    // Owned by another player - charge rent
                    const owner = game.players.find(p => p.id === space.owner);
                    if (owner && !owner.isBankrupt && !space.mortgaged) {
                        const rentAmount = game.calculateRent(space, diceTotal);
                        
                        // Deduct rent from player
                        const actualRent = Math.min(player.money, rentAmount);
                        player.money -= actualRent;
                        owner.money += actualRent;
                        
                        result.action = 'rent-paid';
                        result.rentAmount = actualRent;
                        result.ownerId = owner.id;
                        result.ownerName = owner.name;
                        result.propertyName = space.name;
                        
                        // Check for bankruptcy after rent payment
                        if (player.money <= 0) {
                            result.bankruptcyTriggered = true;
                            result.creditorId = owner.id;
                        }
                        
                        game.addHistory({
                            type: 'rent_paid',
                            playerId: player.id,
                            ownerId: owner.id,
                            amount: actualRent,
                            property: space.name
                        });
                    } else {
                        result.action = 'none';
                    }
                } else {
                    // Player owns the property
                    result.action = 'own-property';
                }
                break;

            case 'chance':
                const chanceCard = game.drawChanceCard();
                const chanceResult = game.executeCardAction(player, chanceCard);
                result.action = 'card-drawn';
                result.cardType = 'chance';
                result.cardText = chanceCard.text;
                result.cardAction = chanceResult.action;
                result.message = chanceResult.message;
                result.requiresMovement = chanceResult.requiresMovement;
                result.newPosition = chanceResult.newPosition;
                result.moneyChange = chanceResult.moneyChange;
                result.rentMultiplier = chanceResult.rentMultiplier;
                
                game.addHistory({
                    type: 'card_drawn',
                    playerId: player.id,
                    cardType: 'chance',
                    cardText: chanceCard.text
                });
                break;

            case 'community-chest':
                const communityCard = game.drawCommunityChestCard();
                const communityResult = game.executeCardAction(player, communityCard);
                result.action = 'card-drawn';
                result.cardType = 'community-chest';
                result.cardText = communityCard.text;
                result.cardAction = communityResult.action;
                result.message = communityResult.message;
                result.requiresMovement = communityResult.requiresMovement;
                result.newPosition = communityResult.newPosition;
                result.moneyChange = communityResult.moneyChange;
                result.rentMultiplier = communityResult.rentMultiplier;
                
                game.addHistory({
                    type: 'card_drawn',
                    playerId: player.id,
                    cardType: 'community-chest',
                    cardText: communityCard.text
                });
                break;

            case 'tax':
                const taxAmount = Math.min(player.money, space.amount);
                player.money -= taxAmount;
                
                // Add to free parking if enabled
                if (game.settings.freeParkingJackpot) {
                    game.freeParkingJackpot += taxAmount;
                }
                
                result.action = 'tax-paid';
                result.taxName = space.name;
                result.taxAmount = taxAmount;
                
                // Check for bankruptcy after tax payment
                if (player.money <= 0) {
                    result.bankruptcyTriggered = true;
                    result.creditorId = null; // Bank is creditor for taxes
                }
                
                game.addHistory({
                    type: 'tax_paid',
                    playerId: player.id,
                    amount: taxAmount,
                    taxName: space.name
                });
                break;

            case 'go-to-jail':
                player.position = 10; // Jail position
                player.inJail = true;
                player.jailTurns = 0;
                
                result.action = 'go-to-jail';
                
                game.addHistory({
                    type: 'go_to_jail',
                    playerId: player.id,
                    reason: 'landed_on_space'
                });
                break;

            case 'free-parking':
                if (game.settings.freeParkingJackpot && game.freeParkingJackpot > 0) {
                    player.money += game.freeParkingJackpot;
                    result.action = 'free-parking-jackpot';
                    result.jackpotAmount = game.freeParkingJackpot;
                    game.freeParkingJackpot = 0;
                } else {
                    result.action = 'free-parking';
                }
                break;

            case 'go':
            case 'jail':
            case 'corner':
            default:
                result.action = 'none';
                break;
        }

        return result;
    }

    /**
     * Handle property purchase
     */
    buyProperty(roomCode, playerId) {
        const game = this.getGame(roomCode);
        if (!game) {
            throw new Error('Game not found');
        }

        const player = game.players.find(p => p.id === playerId);
        if (!player) {
            throw new Error('Player not found');
        }

        const property = game.board[player.position];
        const validation = validatePropertyPurchase(player, property);
        
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        // Execute purchase
        player.removeMoney(property.price);
        property.owner = player.id;
        player.addProperty(player.position);

        game.addHistory({
            type: 'property_purchase',
            playerId: player.id,
            propertyIndex: player.position,
            price: property.price
        });

        logger.info(`Player ${player.name} bought ${property.name} for ৳${property.price}`);
        return { player, property };
    }

    /**
     * Handle building purchase (house/hotel)
     */
    buildHouse(roomCode, playerId, propertyIndex) {
        const game = this.getGame(roomCode);
        if (!game) {
            throw new Error('Game not found');
        }

        const player = game.players.find(p => p.id === playerId);
        const property = game.board[propertyIndex];
        
        const validation = validateBuildingPurchase(player, property, game);
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        const buildCost = property.buildCost;
        player.removeMoney(buildCost);

        if (property.houses < 4) {
            property.houses++;
            game.availableHouses--;
        } else {
            // Build hotel
            property.houses = 0;
            property.hotels = 1;
            game.availableHouses += 4; // Return houses to bank
            game.availableHotels--;
        }

        game.addHistory({
            type: 'building_purchase',
            playerId: player.id,
            propertyIndex,
            buildingType: property.hotels > 0 ? 'hotel' : 'house',
            cost: buildCost
        });

        logger.info(`Player ${player.name} built on ${property.name}`);
        return { player, property };
    }

    /**
     * Handle property mortgage
     */
    mortgageProperty(roomCode, playerId, propertyIndex) {
        const game = this.getGame(roomCode);
        if (!game) {
            throw new Error('Game not found');
        }

        const player = game.players.find(p => p.id === playerId);
        const property = game.board[propertyIndex];
        
        const validation = validateMortgage(player, property);
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        const mortgageValue = Math.floor(property.price * 0.5);
        player.addMoney(mortgageValue);
        property.mortgaged = true;

        game.addHistory({
            type: 'mortgage',
            playerId: player.id,
            propertyIndex,
            amount: mortgageValue
        });

        logger.info(`Player ${player.name} mortgaged ${property.name} for ৳${mortgageValue}`);
        return { player, property };
    }

    /**
     * Handle property unmortgage
     */
    unmortgageProperty(roomCode, playerId, propertyIndex) {
        const game = this.getGame(roomCode);
        if (!game) {
            throw new Error('Game not found');
        }

        const player = game.players.find(p => p.id === playerId);
        const property = game.board[propertyIndex];
        
        const validation = validateUnmortgage(player, property);
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        const unmortgageCost = Math.floor(property.price * 0.55);
        player.removeMoney(unmortgageCost);
        property.mortgaged = false;

        game.addHistory({
            type: 'unmortgage',
            playerId: player.id,
            propertyIndex,
            amount: unmortgageCost
        });

        logger.info(`Player ${player.name} unmortgaged ${property.name} for ৳${unmortgageCost}`);
        return { player, property };
    }

    /**
     * Handle rent payment
     */
    payRent(roomCode, payerId, ownerId, amount) {
        const game = this.getGame(roomCode);
        if (!game) {
            throw new Error('Game not found');
        }

        const payer = game.players.find(p => p.id === payerId);
        const owner = game.players.find(p => p.id === ownerId);

        if (!payer || !owner) {
            throw new Error('Player not found');
        }

        payer.removeMoney(amount);
        owner.addMoney(amount);

        game.addHistory({
            type: 'rent_payment',
            payerId: payer.id,
            ownerId: owner.id,
            amount
        });

        return { payer, owner };
    }

    /**
     * Handle trade offer
     */
    createTradeOffer(roomCode, fromPlayerId, toPlayerId, offer) {
        const game = this.getGame(roomCode);
        if (!game) {
            throw new Error('Game not found');
        }

        const fromPlayer = game.players.find(p => p.id === fromPlayerId);
        const toPlayer = game.players.find(p => p.id === toPlayerId);

        const validation = validateTradeOffer(fromPlayer, toPlayer, offer, game);
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        const trade = {
            id: `trade_${Date.now()}`,
            fromPlayerId,
            toPlayerId,
            offer,
            status: 'pending',
            createdAt: Date.now()
        };

        game.activeTrades.push(trade);
        return trade;
    }

    /**
     * Handle trade response
     */
    respondToTrade(roomCode, tradeId, accept) {
        const game = this.getGame(roomCode);
        if (!game) {
            throw new Error('Game not found');
        }

        const tradeIndex = game.activeTrades.findIndex(t => t.id === tradeId);
        if (tradeIndex === -1) {
            throw new Error('Trade not found');
        }

        const trade = game.activeTrades[tradeIndex];
        
        if (accept) {
            // Execute trade
            const fromPlayer = game.players.find(p => p.id === trade.fromPlayerId);
            const toPlayer = game.players.find(p => p.id === trade.toPlayerId);

            // Transfer properties
            if (trade.offer.offeredProperties) {
                trade.offer.offeredProperties.forEach(propIndex => {
                    game.board[propIndex].owner = toPlayer.id;
                    fromPlayer.removeProperty(propIndex);
                    toPlayer.addProperty(propIndex);
                });
            }

            if (trade.offer.requestedProperties) {
                trade.offer.requestedProperties.forEach(propIndex => {
                    game.board[propIndex].owner = fromPlayer.id;
                    toPlayer.removeProperty(propIndex);
                    fromPlayer.addProperty(propIndex);
                });
            }

            // Transfer money
            if (trade.offer.offeredMoney) {
                fromPlayer.removeMoney(trade.offer.offeredMoney);
                toPlayer.addMoney(trade.offer.offeredMoney);
            }

            if (trade.offer.requestedMoney) {
                toPlayer.removeMoney(trade.offer.requestedMoney);
                fromPlayer.addMoney(trade.offer.requestedMoney);
            }

            trade.status = 'accepted';
            game.addHistory({
                type: 'trade_completed',
                trade
            });
        } else {
            trade.status = 'rejected';
        }

        game.activeTrades.splice(tradeIndex, 1);
        return trade;
    }

    /**
     * End current turn
     */
    endTurn(roomCode) {
        const game = this.getGame(roomCode);
        if (!game) {
            throw new Error('Game not found');
        }

        game.nextTurn();
        game.addHistory({
            type: 'turn_end',
            playerId: game.players[game.currentPlayerIndex].id
        });

        return game;
    }

    /**
     * Handle player bankruptcy
     */
    declareBankruptcy(roomCode, playerId, creditorId = null) {
        const game = this.getGame(roomCode);
        if (!game) {
            throw new Error('Game not found');
        }

        const player = game.players.find(p => p.id === playerId);
        if (!player) {
            throw new Error('Player not found');
        }

        player.declareBankruptcy();

        // Transfer assets to creditor or bank
        if (creditorId) {
            const creditor = game.players.find(p => p.id === creditorId);
            if (creditor) {
                // Transfer all properties
                player.properties.forEach(propIndex => {
                    game.board[propIndex].owner = creditor.id;
                    creditor.addProperty(propIndex);
                });
                creditor.addMoney(player.money);
            }
        } else {
            // Return to bank (unowned)
            player.properties.forEach(propIndex => {
                const property = game.board[propIndex];
                property.owner = null;
                property.houses = 0;
                property.hotels = 0;
                property.mortgaged = false;
            });
        }

        player.properties = [];
        player.money = 0;

        game.addHistory({
            type: 'bankruptcy',
            playerId: player.id,
            creditorId
        });

        // Check for winner
        const activePlayers = game.players.filter(p => !p.isBankrupt);
        if (activePlayers.length === 1) {
            game.status = 'finished';
            game.addHistory({
                type: 'game_end',
                winnerId: activePlayers[0].id
            });
        }

        return { player, game };
    }

    /**
     * Start auction for a property
     */
    startAuction(roomCode, propertyIndex) {
        const game = this.getGame(roomCode);
        if (!game) {
            throw new Error('Game not found');
        }

        const property = game.board[propertyIndex];
        if (!property || property.owner) {
            throw new Error('Property cannot be auctioned');
        }

        game.auction = {
            propertyIndex,
            currentBid: 0,
            currentBidder: null,
            bids: [],
            startedAt: Date.now(),
            endTime: Date.now() + 30000, // 30 seconds
            isActive: true
        };

        game.addHistory({
            type: 'auction_started',
            propertyIndex,
            property: property.name
        });

        return game.auction;
    }

    /**
     * Place bid in auction
     */
    placeBid(roomCode, playerId, amount) {
        const game = this.getGame(roomCode);
        if (!game) {
            throw new Error('Game not found');
        }

        if (!game.auction || !game.auction.isActive) {
            throw new Error('No active auction');
        }

        const player = game.players.find(p => p.id === playerId);
        if (!player) {
            throw new Error('Player not found');
        }

        // Validate bid
        if (amount <= game.auction.currentBid) {
            throw new Error('Bid must be higher than current bid');
        }

        if (amount > player.money) {
            throw new Error('Insufficient funds');
        }

        // Place bid
        game.auction.currentBid = amount;
        game.auction.currentBidder = playerId;
        game.auction.bids.push({
            playerId,
            amount,
            timestamp: Date.now()
        });

        // Reset timer
        game.auction.endTime = Date.now() + 10000; // 10 more seconds

        game.addHistory({
            type: 'auction_bid',
            playerId,
            amount
        });

        return game.auction;
    }

    /**
     * End auction and award property
     */
    endAuction(roomCode) {
        const game = this.getGame(roomCode);
        if (!game) {
            throw new Error('Game not found');
        }

        if (!game.auction || !game.auction.isActive) {
            throw new Error('No active auction');
        }

        game.auction.isActive = false;
        const auction = game.auction;

        // Award property to winner
        if (auction.currentBidder && auction.currentBid > 0) {
            const winner = game.players.find(p => p.id === auction.currentBidder);
            const property = game.board[auction.propertyIndex];

            if (winner && property) {
                winner.removeMoney(auction.currentBid);
                property.owner = winner.id;
                winner.addProperty(auction.propertyIndex);

                game.addHistory({
                    type: 'auction_won',
                    playerId: winner.id,
                    propertyIndex: auction.propertyIndex,
                    amount: auction.currentBid
                });

                logger.info(`Player ${winner.name} won auction for ${property.name} with bid of ৳${auction.currentBid}`);
            }
        }

        const result = { ...auction };
        game.auction = null;
        return result;
    }

    /**
     * Add chat message
     */
    addChatMessage(roomCode, playerId, message) {
        const game = this.getGame(roomCode);
        if (!game) {
            throw new Error('Game not found');
        }

        game.addChatMessage(playerId, message);
        return game.chatHistory[game.chatHistory.length - 1];
    }

    /**
     * Save game state
     */
    saveGame(roomCode) {
        const game = this.getGame(roomCode);
        if (!game) {
            throw new Error('Game not found');
        }

        try {
            const gameState = GameState.serialize(game);
            
            // Validate before saving
            const validation = GameState.validate(gameState);
            if (!validation.valid) {
                throw new Error(`Invalid game state: ${validation.errors.join(', ')}`);
            }

            // In a real application, you would save to a database here
            // For now, we'll just return the serialized state
            logger.info(`Game state saved for room ${roomCode}`);
            
            return gameState;
        } catch (error) {
            logger.error(`Error saving game state: ${error.message}`);
            throw error;
        }
    }

    /**
     * Load game state
     */
    loadGame(gameState) {
        try {
            // Validate game state
            const validation = GameState.validate(gameState);
            if (!validation.valid) {
                throw new Error(`Invalid game state: ${validation.errors.join(', ')}`);
            }

            // Create a new Game instance from the saved state
            // This would require updating the Game model to support initialization from state
            // For now, we'll return the deserialized state
            const deserialized = GameState.deserialize(gameState);
            
            logger.info(`Game state loaded for room ${deserialized.roomCode}`);
            
            return deserialized;
        } catch (error) {
            logger.error(`Error loading game state: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get game state for client
     */
    getGameState(roomCode) {
        const game = this.getGame(roomCode);
        if (!game) {
            throw new Error('Game not found');
        }

        return GameState.serialize(game);
    }
}

module.exports = GameController;
