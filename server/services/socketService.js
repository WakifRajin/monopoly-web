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
            if (currentPlayer.socketId !== socket.id) {
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
