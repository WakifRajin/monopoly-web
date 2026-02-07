/**
 * Server Configuration
 * Environment-based configuration for the Monopoly game server
 */

const config = {
    // Server Settings
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    
    // Environment
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV !== 'production',
    
    // CORS Settings
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true
    },
    
    // Game Settings
    game: {
        maxRooms: 100,
        maxPlayersPerRoom: 8,
        minPlayersPerRoom: 2,
        roomCodeLength: 6,
        turnTimeoutMs: 120000, // 2 minutes per turn
        reconnectTimeoutMs: 300000, // 5 minutes to reconnect
        
        // Monopoly Game Constants
        startingMoney: 15000,
        goSalary: 2000,
        jailFine: 500,
        maxJailTurns: 3,
        
        // Building Limits (official Monopoly rules)
        maxHouses: 32,
        maxHotels: 12
    },
    
    // Database Settings
    database: {
        filename: process.env.DB_FILE || './monopoly.db',
        verbose: process.env.DB_VERBOSE === 'true'
    },
    
    // Rate Limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    },
    
    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        enableConsole: true,
        enableFile: process.env.LOG_TO_FILE === 'true'
    }
};

module.exports = config;
