/**
 * Room Controller
 * Handles room creation, joining, and management
 */

const Room = require('../models/Room');
const Player = require('../models/Player');
const logger = require('../utils/logger');
const { validateRoomCreation, validateRoomJoin } = require('../utils/validators');

class RoomController {
    constructor() {
        this.rooms = new Map(); // roomCode -> Room
    }

    /**
     * Create a new room
     */
    createRoom(hostSocketId, data) {
        const validation = validateRoomCreation(data);
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        // Create host player
        const hostPlayer = new Player(
            this.generatePlayerId(),
            data.hostName,
            hostSocketId
        );
        hostPlayer.isHost = true;
        hostPlayer.isReady = false; // Host must also ready up

        // Create room
        const room = new Room(hostPlayer, {
            isPublic: data.isPublic,
            maxPlayers: data.maxPlayers,
            startingMoney: data.startingMoney,
            goSalary: data.goSalary,
            jailFine: data.jailFine,
            freeParkingJackpot: data.freeParkingJackpot,
            auctionEnabled: data.auctionEnabled,
            turnTimeLimit: data.turnTimeLimit,
            fastMode: data.fastMode
        });

        // Assign player color and token
        this.assignPlayerAppearance(hostPlayer, 0);

        this.rooms.set(room.code, room);
        logger.info(`Room created: ${room.code} by ${hostPlayer.name}`);

        return { room, player: hostPlayer };
    }

    /**
     * Join an existing room
     */
    joinRoom(socketId, data) {
        const validation = validateRoomJoin(data);
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        const room = this.rooms.get(data.roomCode);
        if (!room) {
            throw new Error('Room not found');
        }

        if (room.isFull()) {
            throw new Error('Room is full');
        }

        if (room.status !== 'waiting') {
            throw new Error('Game has already started');
        }

        // Create player
        const player = new Player(
            this.generatePlayerId(),
            data.playerName,
            socketId
        );
        player.isReady = false;

        // Assign player color and token
        this.assignPlayerAppearance(player, room.players.length);

        room.addPlayer(player);
        logger.info(`Player ${player.name} joined room ${room.code}`);

        return { room, player };
    }

    /**
     * Leave a room
     */
    leaveRoom(socketId) {
        for (const [code, room] of this.rooms.entries()) {
            const player = room.getPlayerBySocketId(socketId);
            if (player) {
                room.removePlayer(player.id);
                logger.info(`Player ${player.name} left room ${code}`);

                // Delete room if empty
                if (room.isEmpty()) {
                    this.rooms.delete(code);
                    logger.info(`Room ${code} deleted (empty)`);
                }

                return { room, player };
            }
        }
        return null;
    }

    /**
     * Get room by code
     */
    getRoom(roomCode) {
        return this.rooms.get(roomCode);
    }

    /**
     * Get room by socket ID
     */
    getRoomBySocketId(socketId) {
        for (const room of this.rooms.values()) {
            if (room.getPlayerBySocketId(socketId)) {
                return room;
            }
        }
        return null;
    }

    /**
     * Get player by socket ID
     */
    getPlayerBySocketId(socketId) {
        for (const room of this.rooms.values()) {
            const player = room.getPlayerBySocketId(socketId);
            if (player) {
                return { room, player };
            }
        }
        return null;
    }

    /**
     * Set player ready status
     */
    setPlayerReady(socketId, isReady) {
        const result = this.getPlayerBySocketId(socketId);
        if (!result) {
            throw new Error('Player not found');
        }

        result.player.isReady = isReady;
        logger.info(`Player ${result.player.name} ready status: ${isReady}`);

        return result;
    }

    /**
     * Get list of public rooms
     */
    getPublicRooms() {
        return Array.from(this.rooms.values())
            .filter(room => room.isPublic && room.status === 'waiting')
            .map(room => room.getSummary());
    }

    /**
     * Assign player appearance (color and token)
     */
    assignPlayerAppearance(player, index) {
        const colors = ['#FF0000', '#0000FF', '#008000', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'];
        const tokens = ['🚗', '🎩', '🚢', '👢', '🐕', '🐈', '🚁', '🚀'];

        player.color = colors[index % colors.length];
        player.token = tokens[index % tokens.length];
    }

    /**
     * Generate unique player ID
     */
    generatePlayerId() {
        return `player_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Clean up inactive rooms (called periodically)
     */
    cleanupInactiveRooms() {
        const now = Date.now();
        const timeout = 30 * 60 * 1000; // 30 minutes

        for (const [code, room] of this.rooms.entries()) {
            if (room.status === 'waiting' && (now - room.createdAt) > timeout) {
                this.rooms.delete(code);
                logger.info(`Room ${code} deleted (timeout)`);
            }
        }
    }
}

module.exports = RoomController;
