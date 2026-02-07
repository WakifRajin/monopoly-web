/**
 * Socket Service
 * Handles WebSocket event handlers and real-time communication
 */

const logger = require('../utils/logger');
const { sanitizeChatMessage } = require('../utils/validators');

class SocketService {
    constructor(io, roomController, gameController) {
        this.io = io;
        this.roomController = roomController;
        this.gameController = gameController;
    }

    /**
     * Initialize socket event handlers
     */
    initialize() {
        this.io.on('connection', (socket) => {
            logger.info(`Client connected: ${socket.id}`);

            // Room events
            socket.on('create-room', (data) => this.handleCreateRoom(socket, data));
            socket.on('join-room', (data) => this.handleJoinRoom(socket, data));
            socket.on('leave-room', () => this.handleLeaveRoom(socket));
            socket.on('player-ready', (data) => this.handlePlayerReady(socket, data));
            socket.on('start-game', () => this.handleStartGame(socket));
            socket.on('get-public-rooms', () => this.handleGetPublicRooms(socket));

            // Game events
            socket.on('roll-dice', () => this.handleRollDice(socket));
            socket.on('buy-property', () => this.handleBuyProperty(socket));
            socket.on('end-turn', () => this.handleEndTurn(socket));
            socket.on('build-house', (data) => this.handleBuildHouse(socket, data));
            socket.on('mortgage-property', (data) => this.handleMortgageProperty(socket, data));
            socket.on('unmortgage-property', (data) => this.handleUnmortgageProperty(socket, data));
            socket.on('pay-jail-fine', () => this.handlePayJailFine(socket));
            socket.on('use-jail-card', () => this.handleUseJailCard(socket));

            // Trade events
            socket.on('trade-offer', (data) => this.handleTradeOffer(socket, data));
            socket.on('trade-response', (data) => this.handleTradeResponse(socket, data));

            // Auction events
            socket.on('start-auction', (data) => this.handleStartAuction(socket, data));
            socket.on('place-bid', (data) => this.handlePlaceBid(socket, data));
            socket.on('end-auction', () => this.handleEndAuction(socket));

            // Game persistence events
            socket.on('save-game', () => this.handleSaveGame(socket));
            socket.on('get-game-state', () => this.handleGetGameState(socket));
            socket.on('request-game-state', (data) => this.handleRequestGameState(socket, data));
            socket.on('load-game', (data) => this.handleLoadGame(socket, data));

            // Chat events
            socket.on('chat-message', (data) => this.handleChatMessage(socket, data));

            // Disconnect
            socket.on('disconnect', () => this.handleDisconnect(socket));
        });
    }

    /**
     * Handle room creation
     */
    handleCreateRoom(socket, data) {
        try {
            const { room, player } = this.roomController.createRoom(socket.id, data);
            
            socket.join(room.code);
            socket.emit('room-created', {
                success: true,
                room: room.toJSON(),
                playerId: player.id
            });

            logger.info(`Room created: ${room.code}`);
        } catch (error) {
            logger.error('Error creating room:', error.message);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle room joining
     */
    handleJoinRoom(socket, data) {
        try {
            const { room, player } = this.roomController.joinRoom(socket.id, data);
            
            socket.join(room.code);
            
            // Notify all players in room
            this.io.to(room.code).emit('player-joined', {
                room: room.toJSON(),
                player: player.toJSON()
            });

            socket.emit('room-joined', {
                success: true,
                room: room.toJSON(),
                playerId: player.id
            });

            logger.info(`Player ${player.name} joined room ${room.code}`);
        } catch (error) {
            logger.error('Error joining room:', error.message);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle leaving room
     */
    handleLeaveRoom(socket) {
        try {
            const result = this.roomController.leaveRoom(socket.id);
            if (result) {
                socket.leave(result.room.code);
                
                // Notify remaining players
                this.io.to(result.room.code).emit('player-left', {
                    room: result.room.toJSON(),
                    playerId: result.player.id
                });

                socket.emit('room-left', { success: true });
            }
        } catch (error) {
            logger.error('Error leaving room:', error.message);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle player ready
     */
    handlePlayerReady(socket, data) {
        try {
            const result = this.roomController.setPlayerReady(socket.id, data.isReady);
            
            this.io.to(result.room.code).emit('player-ready-changed', {
                playerId: result.player.id,
                isReady: result.player.isReady,
                allReady: result.room.areAllPlayersReady()
            });
        } catch (error) {
            logger.error('Error setting player ready:', error.message);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle game start
     */
    handleStartGame(socket) {
        try {
            const room = this.roomController.getRoomBySocketId(socket.id);
            if (!room) {
                throw new Error('Room not found');
            }

            const game = this.gameController.startGame(room);
            
            this.io.to(room.code).emit('game-started', {
                game: game.toJSON()
            });

            logger.info(`Game started in room ${room.code}`);
        } catch (error) {
            logger.error('Error starting game:', error.message);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle dice roll
     */
    handleRollDice(socket) {
        try {
            const result = this.roomController.getPlayerBySocketId(socket.id);
            if (!result) {
                throw new Error('Player not found');
            }

            const game = this.gameController.getGame(result.room.code);
            if (!game) {
                throw new Error('Game not found');
            }

            const currentPlayer = game.getCurrentPlayer();
            // Fix: Compare player IDs instead of socketIds to avoid stale socketId issues
            // result.player is the player object returned by getPlayerBySocketId() earlier in this function
            if (currentPlayer.id !== result.player.id) {
                throw new Error('Not your turn');
            }

            const rollResult = this.gameController.rollDice(result.room.code);
            
            this.io.to(result.room.code).emit('dice-rolled', {
                dice: rollResult.dice,
                isDoubles: rollResult.isDoubles,
                doublesCount: rollResult.doublesCount,
                playerId: currentPlayer.id,
                newPosition: rollResult.newPosition,
                passedGo: rollResult.passedGo,
                goToJail: rollResult.goToJail,
                game: game.toJSON()
            });
        } catch (error) {
            logger.error('Error rolling dice:', error.message);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle property purchase
     */
    handleBuyProperty(socket) {
        try {
            const result = this.roomController.getPlayerBySocketId(socket.id);
            if (!result) {
                throw new Error('Player not found');
            }

            const game = this.gameController.getGame(result.room.code);
            if (!game) {
                throw new Error('Game not found');
            }

            const { player, property } = this.gameController.buyProperty(
                result.room.code,
                result.player.id
            );

            this.io.to(result.room.code).emit('property-bought', {
                playerId: player.id,
                propertyIndex: player.position,
                property,
                game: game.toJSON()
            });
        } catch (error) {
            logger.error('Error buying property:', error.message);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle building purchase
     */
    handleBuildHouse(socket, data) {
        try {
            const result = this.roomController.getPlayerBySocketId(socket.id);
            if (!result) {
                throw new Error('Player not found');
            }

            const game = this.gameController.getGame(result.room.code);
            if (!game) {
                throw new Error('Game not found');
            }

            const buildResult = this.gameController.buildHouse(
                result.room.code,
                result.player.id,
                data.propertyIndex
            );

            this.io.to(result.room.code).emit('building-built', {
                playerId: buildResult.player.id,
                propertyIndex: data.propertyIndex,
                property: buildResult.property,
                game: game.toJSON()
            });
        } catch (error) {
            logger.error('Error building house:', error.message);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle property mortgage
     */
    handleMortgageProperty(socket, data) {
        try {
            const result = this.roomController.getPlayerBySocketId(socket.id);
            if (!result) {
                throw new Error('Player not found');
            }

            const game = this.gameController.getGame(result.room.code);
            if (!game) {
                throw new Error('Game not found');
            }

            const mortgageResult = this.gameController.mortgageProperty(
                result.room.code,
                result.player.id,
                data.propertyIndex
            );

            this.io.to(result.room.code).emit('property-mortgaged', {
                playerId: mortgageResult.player.id,
                propertyIndex: data.propertyIndex,
                property: mortgageResult.property,
                game: game.toJSON()
            });
        } catch (error) {
            logger.error('Error mortgaging property:', error.message);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle property unmortgage
     */
    handleUnmortgageProperty(socket, data) {
        try {
            const result = this.roomController.getPlayerBySocketId(socket.id);
            if (!result) {
                throw new Error('Player not found');
            }

            const game = this.gameController.getGame(result.room.code);
            if (!game) {
                throw new Error('Game not found');
            }

            const unmortgageResult = this.gameController.unmortgageProperty(
                result.room.code,
                result.player.id,
                data.propertyIndex
            );

            this.io.to(result.room.code).emit('property-unmortgaged', {
                playerId: unmortgageResult.player.id,
                propertyIndex: data.propertyIndex,
                property: unmortgageResult.property,
                game: game.toJSON()
            });
        } catch (error) {
            logger.error('Error unmortgaging property:', error.message);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle jail fine payment
     */
    handlePayJailFine(socket) {
        try {
            const result = this.roomController.getPlayerBySocketId(socket.id);
            if (!result) {
                throw new Error('Player not found');
            }

            const game = this.gameController.getGame(result.room.code);
            if (!game) {
                throw new Error('Game not found');
            }

            const player = result.player;
            if (!player.isInJail) {
                throw new Error('Player is not in jail');
            }

            if (player.money < game.settings.jailFine) {
                throw new Error('Insufficient funds');
            }

            player.removeMoney(game.settings.jailFine);
            player.releaseFromJail();

            this.io.to(result.room.code).emit('jail-fine-paid', {
                playerId: player.id,
                game: game.toJSON()
            });
        } catch (error) {
            logger.error('Error paying jail fine:', error.message);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle use jail card
     */
    handleUseJailCard(socket) {
        try {
            const result = this.roomController.getPlayerBySocketId(socket.id);
            if (!result) {
                throw new Error('Player not found');
            }

            const player = result.player;
            if (!player.isInJail) {
                throw new Error('Player is not in jail');
            }

            if (player.getOutOfJailFreeCards <= 0) {
                throw new Error('No Get Out of Jail Free cards');
            }

            player.getOutOfJailFreeCards--;
            player.releaseFromJail();

            const game = this.gameController.getGame(result.room.code);
            this.io.to(result.room.code).emit('jail-card-used', {
                playerId: player.id,
                game: game.toJSON()
            });
        } catch (error) {
            logger.error('Error using jail card:', error.message);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle end turn
     */
    handleEndTurn(socket) {
        try {
            const result = this.roomController.getPlayerBySocketId(socket.id);
            if (!result) {
                throw new Error('Player not found');
            }

            const game = this.gameController.endTurn(result.room.code);
            
            this.io.to(result.room.code).emit('turn-changed', {
                game: game.toJSON(),
                currentPlayerId: game.getCurrentPlayer().id
            });
        } catch (error) {
            logger.error('Error ending turn:', error.message);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle trade offer
     */
    handleTradeOffer(socket, data) {
        try {
            const result = this.roomController.getPlayerBySocketId(socket.id);
            if (!result) {
                throw new Error('Player not found');
            }

            const trade = this.gameController.createTradeOffer(
                result.room.code,
                result.player.id,
                data.toPlayerId,
                data.offer
            );

            // Notify the other player
            const toPlayer = result.room.getPlayer(data.toPlayerId);
            if (toPlayer) {
                this.io.to(toPlayer.socketId).emit('trade-offer-received', {
                    trade,
                    fromPlayer: result.player.toJSON()
                });
            }
        } catch (error) {
            logger.error('Error creating trade offer:', error.message);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle trade response
     */
    handleTradeResponse(socket, data) {
        try {
            const result = this.roomController.getPlayerBySocketId(socket.id);
            if (!result) {
                throw new Error('Player not found');
            }

            const trade = this.gameController.respondToTrade(
                result.room.code,
                data.tradeId,
                data.accept
            );

            const game = this.gameController.getGame(result.room.code);
            
            this.io.to(result.room.code).emit('trade-completed', {
                trade,
                game: game.toJSON()
            });
        } catch (error) {
            logger.error('Error responding to trade:', error.message);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle starting auction
     */
    handleStartAuction(socket, data) {
        try {
            const result = this.roomController.getPlayerBySocketId(socket.id);
            if (!result) {
                throw new Error('Player not found');
            }

            const auction = this.gameController.startAuction(result.room.code, data.propertyIndex);
            const game = this.gameController.getGame(result.room.code);

            this.io.to(result.room.code).emit('auction-started', {
                auction,
                property: game.board[data.propertyIndex],
                gameState: game.toJSON()
            });

            logger.info(`Auction started in room ${result.room.code} for property ${data.propertyIndex}`);
        } catch (error) {
            logger.error('Error starting auction:', error.message);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle placing bid
     */
    handlePlaceBid(socket, data) {
        try {
            const result = this.roomController.getPlayerBySocketId(socket.id);
            if (!result) {
                throw new Error('Player not found');
            }

            const auction = this.gameController.placeBid(result.room.code, result.player.id, data.amount);
            const game = this.gameController.getGame(result.room.code);

            this.io.to(result.room.code).emit('bid-placed', {
                auction,
                playerId: result.player.id,
                playerName: result.player.name,
                amount: data.amount,
                gameState: game.toJSON()
            });

            logger.info(`Player ${result.player.name} bid ৳${data.amount} in room ${result.room.code}`);
        } catch (error) {
            logger.error('Error placing bid:', error.message);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle ending auction
     */
    handleEndAuction(socket) {
        try {
            const result = this.roomController.getPlayerBySocketId(socket.id);
            if (!result) {
                throw new Error('Player not found');
            }

            const auctionResult = this.gameController.endAuction(result.room.code);
            const game = this.gameController.getGame(result.room.code);

            this.io.to(result.room.code).emit('auction-ended', {
                result: auctionResult,
                gameState: game.toJSON()
            });

            logger.info(`Auction ended in room ${result.room.code}`);
        } catch (error) {
            logger.error('Error ending auction:', error.message);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle save game
     */
    handleSaveGame(socket) {
        try {
            const result = this.roomController.getPlayerBySocketId(socket.id);
            if (!result) {
                throw new Error('Player not found');
            }

            const gameState = this.gameController.saveGame(result.room.code);

            socket.emit('game-saved', {
                success: true,
                timestamp: Date.now(),
                gameState: gameState
            });

            logger.info(`Game saved in room ${result.room.code}`);
        } catch (error) {
            logger.error('Error saving game:', error.message);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle get game state
     */
    handleGetGameState(socket) {
        try {
            const result = this.roomController.getPlayerBySocketId(socket.id);
            if (!result) {
                throw new Error('Player not found');
            }

            const gameState = this.gameController.getGameState(result.room.code);

            socket.emit('game-state-retrieved', {
                gameState: gameState
            });

            logger.info(`Game state retrieved for room ${result.room.code}`);
        } catch (error) {
            logger.error('Error getting game state:', error.message);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle request game state (when joining game page)
     */
    handleRequestGameState(socket, data) {
        try {
            const { roomCode, playerId } = data;
            
            if (!roomCode) {
                throw new Error('Room code is required');
            }

            // Get the game
            const game = this.gameController.getGame(roomCode);
            
            if (!game) {
                throw new Error('Game not found');
            }

            // Join the socket to the room so it receives broadcasts
            socket.join(roomCode);
            logger.info(`Socket ${socket.id} joined room ${roomCode}`);

            // Handle player reconnection if playerId is provided
            // This is CRITICAL - we need to update socketId in both Room and Game models
            if (playerId) {
                const room = this.roomController.getRoom(roomCode);
                let playerUpdated = false;
                
                if (room) {
                    // Try to find player by ID in room
                    const roomPlayer = room.getPlayer(playerId);
                    if (roomPlayer) {
                        // Update player's socket ID and mark as reconnected
                        roomPlayer.socketId = socket.id;
                        roomPlayer.disconnected = false;
                        playerUpdated = true;
                        logger.info(`✓ Updated Room player ${roomPlayer.name} (${playerId}) with socket ${socket.id}`);
                    } else {
                        logger.warn(`⚠ Player ${playerId} not found in room ${roomCode} during reconnection attempt`);
                    }
                } else {
                    logger.warn(`⚠ Room ${roomCode} not found during player ${playerId} reconnection attempt`);
                }

                // CRITICAL FIX: Also update the socketId in the Game model's player objects
                // This ensures all game action handlers can find the player by socketId
                const gamePlayer = game.players.find(p => p.id === playerId);
                if (gamePlayer) {
                    gamePlayer.socketId = socket.id;
                    gamePlayer.disconnected = false;
                    playerUpdated = true;
                    logger.info(`✓ Updated Game player ${gamePlayer.name} (${playerId}) with socket ${socket.id}`);
                } else {
                    logger.warn(`⚠ Player ${playerId} not found in game ${roomCode} player list`);
                }

                // If player was not found in room or game, log the error
                // We can't reliably match players without a valid playerId
                if (!playerUpdated) {
                    logger.error(`❌ Could not update player socketId - playerId ${playerId} not found in room or game`);
                }
            } else {
                // Fallback: No playerId provided, try to find a disconnected player to reconnect
                logger.warn(`⚠ No playerId provided in request-game-state for room ${roomCode}, attempting fallback reconnection`);
                
                const room = this.roomController.getRoom(roomCode);
                
                // Early exit if room not found (game is already validated above)
                if (!room) {
                    logger.warn(`⚠ Room ${roomCode} not found for fallback reconnection`);
                } else {
                    // Find disconnected players in the room
                    const disconnectedPlayers = room.players.filter(p => p.disconnected);
                    logger.info(`Found ${disconnectedPlayers.length} disconnected player(s) in room ${roomCode}`);
                    
                    if (disconnectedPlayers.length === 0) {
                        logger.info(`No disconnected players found in room ${roomCode}`);
                    } else {
                        // Check if this socket ID is already assigned
                        const existingPlayer = room.getPlayerBySocketId(socket.id);
                        
                        if (existingPlayer) {
                            logger.info(`Socket ${socket.id} already assigned to player ${existingPlayer.name} (${existingPlayer.id})`);
                        } else if (disconnectedPlayers.length === 1) {
                            // Only one disconnected player, safely reconnect them
                            const player = disconnectedPlayers[0];
                            
                            try {
                                // Update both room and game models (best-effort atomic update)
                                player.socketId = socket.id;
                                player.disconnected = false;
                                
                                const gamePlayer = game.players.find(p => p.id === player.id);
                                if (gamePlayer) {
                                    gamePlayer.socketId = socket.id;
                                    gamePlayer.disconnected = false;
                                } else {
                                    logger.warn(`⚠ Player ${player.id} found in room but not in game model - state inconsistency detected`);
                                }
                                
                                logger.info(`✓ Fallback reconnection successful: player ${player.name} (${player.id}) reconnected with socket ${socket.id}`);
                            } catch (error) {
                                logger.error(`❌ Error during fallback reconnection: ${error.message}`);
                                // Rollback room player update if game update failed
                                player.disconnected = true;
                            }
                        } else {
                            // Multiple disconnected players - cannot safely reconnect without playerId
                            logger.warn(`⚠ Multiple disconnected players found (${disconnectedPlayers.length}), cannot safely reconnect without playerId`);
                        }
                    }
                }
            }

            // Send current game state to requesting client
            socket.emit('game-state', {
                game: game.toJSON()
            });

            logger.info(`Sent game state to socket ${socket.id} for room ${roomCode}`);
        } catch (error) {
            logger.error('Error requesting game state:', error.message);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle load game
     */
    handleLoadGame(socket, data) {
        try {
            const result = this.roomController.getPlayerBySocketId(socket.id);
            if (!result) {
                throw new Error('Player not found');
            }

            // Only host can load games
            if (!result.room.isHost(result.player.id)) {
                throw new Error('Only the host can load games');
            }

            // Load and validate game state
            const loadedGameState = this.gameController.loadGame(data.gameState);
            
            // Apply loaded state to current game
            const game = this.gameController.getGame(result.room.code);
            if (!game) {
                throw new Error('Game not found');
            }

            // Restore game properties from loaded state
            game.turn = loadedGameState.turn || 0;
            game.currentPlayerIndex = loadedGameState.currentPlayerIndex || 0;
            game.housesRemaining = loadedGameState.housesRemaining || 32;
            game.hotelsRemaining = loadedGameState.hotelsRemaining || 12;

            // Restore player states
            if (loadedGameState.players) {
                loadedGameState.players.forEach((savedPlayer, index) => {
                    if (game.players[index]) {
                        game.players[index].money = savedPlayer.money;
                        game.players[index].position = savedPlayer.position;
                        game.players[index].properties = savedPlayer.properties || [];
                        game.players[index].inJail = savedPlayer.inJail || false;
                        game.players[index].jailTurns = savedPlayer.jailTurns || 0;
                        game.players[index].getOutOfJailFreeCards = savedPlayer.getOutOfJailFreeCards || 0;
                    }
                });
            }

            // Restore board state
            if (loadedGameState.board) {
                loadedGameState.board.forEach((savedSpace, index) => {
                    if (game.board[index] && savedSpace) {
                        game.board[index].owner = savedSpace.owner;
                        game.board[index].houses = savedSpace.houses || 0;
                        game.board[index].hotels = savedSpace.hotels || 0;
                        game.board[index].mortgaged = savedSpace.mortgaged || false;
                    }
                });
            }

            // Broadcast updated game state to all players
            this.io.to(result.room.code).emit('game-loaded', {
                success: true,
                game: game.toJSON()
            });

            logger.info(`Game loaded in room ${result.room.code}`);
        } catch (error) {
            logger.error('Error loading game:', error.message);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle chat message
     */
    handleChatMessage(socket, data) {
        try {
            const result = this.roomController.getPlayerBySocketId(socket.id);
            if (!result) {
                throw new Error('Player not found');
            }

            const message = sanitizeChatMessage(data.message);
            if (!message) {
                return;
            }

            const chatMessage = this.gameController.addChatMessage(
                result.room.code,
                result.player.id,
                message
            );

            this.io.to(result.room.code).emit('chat-broadcast', {
                ...chatMessage,
                playerName: result.player.name,
                playerColor: result.player.color
            });
        } catch (error) {
            logger.error('Error sending chat message:', error.message);
        }
    }

    /**
     * Handle get public rooms
     */
    handleGetPublicRooms(socket) {
        try {
            const rooms = this.roomController.getPublicRooms();
            socket.emit('public-rooms-list', { rooms });
        } catch (error) {
            logger.error('Error getting public rooms:', error.message);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle disconnect
     */
    handleDisconnect(socket) {
        logger.info(`Client disconnected: ${socket.id}`);
        
        try {
            const result = this.roomController.getPlayerBySocketId(socket.id);
            if (result) {
                result.player.disconnected = true;
                result.player.lastActive = Date.now();

                // Notify other players
                this.io.to(result.room.code).emit('player-disconnected', {
                    playerId: result.player.id,
                    playerName: result.player.name
                });

                // TODO: Implement reconnection logic with timeout
            }
        } catch (error) {
            logger.error('Error handling disconnect:', error.message);
        }
    }
}

module.exports = SocketService;
