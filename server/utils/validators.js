/**
 * Validators Utility
 * Input validation functions for game actions
 */

const config = require('../config/config');

/**
 * Validates room creation data
 */
function validateRoomCreation(data) {
    const errors = [];
    
    if (!data.hostName || typeof data.hostName !== 'string') {
        errors.push('Host name is required');
    } else if (data.hostName.length < 1 || data.hostName.length > 20) {
        errors.push('Host name must be 1-20 characters');
    }
    
    if (data.isPublic !== undefined && typeof data.isPublic !== 'boolean') {
        errors.push('isPublic must be a boolean');
    }
    
    if (data.maxPlayers !== undefined) {
        const max = parseInt(data.maxPlayers);
        if (isNaN(max) || max < config.game.minPlayersPerRoom || max > config.game.maxPlayersPerRoom) {
            errors.push(`Max players must be between ${config.game.minPlayersPerRoom} and ${config.game.maxPlayersPerRoom}`);
        }
    }
    
    return { valid: errors.length === 0, errors };
}

/**
 * Validates room joining data
 */
function validateRoomJoin(data) {
    const errors = [];
    
    if (!data.roomCode || typeof data.roomCode !== 'string') {
        errors.push('Room code is required');
    } else if (data.roomCode.length !== config.game.roomCodeLength) {
        errors.push(`Room code must be ${config.game.roomCodeLength} characters`);
    }
    
    if (!data.playerName || typeof data.playerName !== 'string') {
        errors.push('Player name is required');
    } else if (data.playerName.length < 1 || data.playerName.length > 20) {
        errors.push('Player name must be 1-20 characters');
    }
    
    return { valid: errors.length === 0, errors };
}

/**
 * Validates property purchase
 */
function validatePropertyPurchase(player, property) {
    const errors = [];
    
    if (!property) {
        errors.push('Property does not exist');
        return { valid: false, errors };
    }
    
    if (property.type !== 'property' && property.type !== 'station' && property.type !== 'utility') {
        errors.push('This space cannot be purchased');
    }
    
    if (property.owner !== null) {
        errors.push('Property is already owned');
    }
    
    if (player.money < property.price) {
        errors.push('Insufficient funds');
    }
    
    return { valid: errors.length === 0, errors };
}

/**
 * Validates building purchase (house/hotel)
 */
function validateBuildingPurchase(player, property, game) {
    const errors = [];
    
    if (property.owner !== player.id) {
        errors.push('You do not own this property');
    }
    
    if (property.mortgaged) {
        errors.push('Cannot build on mortgaged property');
    }
    
    // Check if player owns all properties in the color group
    const groupProperties = game.board.filter(p => p.group === property.group && p.type === 'property');
    const ownedByPlayer = groupProperties.every(p => p.owner === player.id);
    
    if (!ownedByPlayer) {
        errors.push('Must own all properties in color group to build');
    }
    
    // Check if building evenly
    const currentHouses = property.houses || 0;
    if (currentHouses < 4) {
        const minHouses = Math.min(...groupProperties.map(p => p.houses || 0));
        if (currentHouses > minHouses) {
            errors.push('Must build evenly across properties in group');
        }
    }
    
    // Check hotel rules
    if (currentHouses === 4 && property.hotels >= 1) {
        errors.push('Property already has a hotel');
    }
    
    // Check building availability
    if (currentHouses < 4 && game.availableHouses <= 0) {
        errors.push('No houses available');
    }
    
    if (currentHouses === 4 && game.availableHotels <= 0) {
        errors.push('No hotels available');
    }
    
    // Check funds
    const buildCost = property.buildCost || Math.floor(property.price * 0.5);
    if (player.money < buildCost) {
        errors.push('Insufficient funds');
    }
    
    return { valid: errors.length === 0, errors };
}

/**
 * Validates property mortgage
 */
function validateMortgage(player, property) {
    const errors = [];
    
    if (property.owner !== player.id) {
        errors.push('You do not own this property');
    }
    
    if (property.mortgaged) {
        errors.push('Property is already mortgaged');
    }
    
    if ((property.houses || 0) > 0 || (property.hotels || 0) > 0) {
        errors.push('Cannot mortgage property with buildings');
    }
    
    return { valid: errors.length === 0, errors };
}

/**
 * Validates property unmortgage
 */
function validateUnmortgage(player, property) {
    const errors = [];
    
    if (property.owner !== player.id) {
        errors.push('You do not own this property');
    }
    
    if (!property.mortgaged) {
        errors.push('Property is not mortgaged');
    }
    
    const unmortgageCost = Math.floor(property.price * 0.55); // 50% + 10% interest
    if (player.money < unmortgageCost) {
        errors.push('Insufficient funds');
    }
    
    return { valid: errors.length === 0, errors };
}

/**
 * Validates trade offer
 */
function validateTradeOffer(fromPlayer, toPlayer, offer, game) {
    const errors = [];
    
    if (fromPlayer.id === toPlayer.id) {
        errors.push('Cannot trade with yourself');
    }
    
    // Validate offered properties
    if (offer.offeredProperties) {
        for (const propId of offer.offeredProperties) {
            const property = game.board[propId];
            if (!property || property.owner !== fromPlayer.id) {
                errors.push(`You do not own property at position ${propId}`);
            }
            if (property.mortgaged) {
                errors.push(`Cannot trade mortgaged property at position ${propId}`);
            }
            if ((property.houses || 0) > 0 || (property.hotels || 0) > 0) {
                errors.push(`Cannot trade property with buildings at position ${propId}`);
            }
        }
    }
    
    // Validate requested properties
    if (offer.requestedProperties) {
        for (const propId of offer.requestedProperties) {
            const property = game.board[propId];
            if (!property || property.owner !== toPlayer.id) {
                errors.push(`Other player does not own property at position ${propId}`);
            }
        }
    }
    
    // Validate money
    if (offer.offeredMoney && (offer.offeredMoney < 0 || offer.offeredMoney > fromPlayer.money)) {
        errors.push('Invalid money amount offered');
    }
    
    if (offer.requestedMoney && offer.requestedMoney < 0) {
        errors.push('Invalid money amount requested');
    }
    
    return { valid: errors.length === 0, errors };
}

/**
 * Sanitizes chat message
 */
function sanitizeChatMessage(message) {
    if (typeof message !== 'string') return '';
    
    // Remove HTML tags and limit length
    return message
        .replace(/<[^>]*>/g, '')
        .trim()
        .substring(0, 500);
}

/**
 * Generates a random room code
 */
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < config.game.roomCodeLength; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

module.exports = {
    validateRoomCreation,
    validateRoomJoin,
    validatePropertyPurchase,
    validateBuildingPurchase,
    validateMortgage,
    validateUnmortgage,
    validateTradeOffer,
    sanitizeChatMessage,
    generateRoomCode
};
