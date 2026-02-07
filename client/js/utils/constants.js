/**
 * Constants
 * Game constants and configuration
 */

const CONSTANTS = {
    // Server configuration
    SERVER_URL: window.location.origin,
    
    // Game settings
    MIN_PLAYERS: 2,
    MAX_PLAYERS: 8,
    DEFAULT_STARTING_MONEY: 15000,
    DEFAULT_GO_SALARY: 2000,
    DEFAULT_JAIL_FINE: 500,
    
    // Chat settings
    MAX_CHAT_MESSAGE_LENGTH: 200,
    
    // Player colors
    PLAYER_COLORS: ['#FF0000', '#0000FF', '#008000', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'],
    
    // Player tokens
    PLAYER_TOKENS: ['🚗', '🎩', '🚢', '👢', '🐕', '🐈', '🚁', '🚀'],
    
    // Connection states
    CONNECTION_STATES: {
        CONNECTED: 'connected',
        DISCONNECTED: 'disconnected',
        CONNECTING: 'connecting'
    },
    
    // Room states
    ROOM_STATES: {
        WAITING: 'waiting',
        READY: 'ready',
        PLAYING: 'playing',
        FINISHED: 'finished'
    },
    
    // Notification types
    NOTIFICATION_TYPES: {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info'
    }
};

// Make constants available globally
if (typeof window !== 'undefined') {
    window.CONSTANTS = CONSTANTS;
}
