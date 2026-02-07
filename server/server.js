/**
 * Main Server Entry Point
 * Monopoly Web Game Server
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const config = require('./config/config');
const logger = require('./utils/logger');
const RoomController = require('./controllers/roomController');
const GameController = require('./controllers/gameController');
const SocketService = require('./services/socketService');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: config.cors,
    pingTimeout: 60000,
    pingInterval: 25000
});

// Middleware
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Initialize controllers
const roomController = new RoomController();
const gameController = new GameController();

// Initialize socket service
const socketService = new SocketService(io, roomController, gameController);
socketService.initialize();

// REST API Routes

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

/**
 * Get server info
 */
app.get('/api/info', (req, res) => {
    res.json({
        version: '1.0.0',
        environment: config.nodeEnv,
        maxRooms: config.game.maxRooms,
        maxPlayersPerRoom: config.game.maxPlayersPerRoom
    });
});

/**
 * Get public rooms list
 */
app.get('/api/rooms', (req, res) => {
    try {
        const rooms = roomController.getPublicRooms();
        res.json({ rooms });
    } catch (error) {
        logger.error('Error getting rooms:', error);
        res.status(500).json({ error: 'Failed to get rooms' });
    }
});

/**
 * Get room details
 */
app.get('/api/rooms/:code', (req, res) => {
    try {
        const room = roomController.getRoom(req.params.code);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        res.json({ room: room.toJSON() });
    } catch (error) {
        logger.error('Error getting room:', error);
        res.status(500).json({ error: 'Failed to get room' });
    }
});

/**
 * Get game state
 */
app.get('/api/games/:roomCode', (req, res) => {
    try {
        const game = gameController.getGame(req.params.roomCode);
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }
        res.json({ game: game.toJSON() });
    } catch (error) {
        logger.error('Error getting game:', error);
        res.status(500).json({ error: 'Failed to get game' });
    }
});

/**
 * Serve client pages
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/game.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Cleanup inactive rooms periodically
setInterval(() => {
    roomController.cleanupInactiveRooms();
}, 5 * 60 * 1000); // Every 5 minutes

// Start server
server.listen(config.port, config.host, () => {
    logger.info(`=================================`);
    logger.info(`🎲 Monopoly Game Server Started`);
    logger.info(`=================================`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Server: http://${config.host}:${config.port}`);
    logger.info(`WebSocket: Ready`);
    logger.info(`=================================`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully...');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

module.exports = { app, server, io };
