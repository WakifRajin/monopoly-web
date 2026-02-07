# Monopoly Game Board

This is the main game board page for the multiplayer Bangladeshi Monopoly game.

## Features

### Game Board
- 40 authentic Bangladeshi-themed board spaces
- Interactive property cards with details modal
- Visual property ownership indicators
- Building indicators (houses and hotels)
- Animated player tokens

### Player Interface
- Real-time player info panels showing:
  - Money
  - Properties owned
  - Current position
  - Jail status
- Active player highlighting
- "You" indicator for current player

### Game Controls
- Roll Dice button with proper dice visualization (1-6 dots)
- Buy Property button (enabled when landing on unowned property)
- Build button (for constructing houses/hotels)
- Mortgage button (for mortgaging properties)
- Trade button (for trading with other players)
- End Turn button

### Communication
- Game log with timestamped events
- Real-time chat with other players
- System notifications for player joins/leaves
- XSS protection for all user input

### Visual Features
- Connection status indicator
- Turn indicator showing current player
- Responsive design (works on desktop and tablets)
- Modern Tailwind CSS styling
- Smooth animations for player movement
- Property highlighting when landing

## Usage

1. Create or join a room from the lobby (index.html)
2. Wait for all players to ready up
3. Host starts the game
4. Players are automatically redirected to game.html with room code
5. Take turns rolling dice, buying properties, and building

## URL Parameters

- `room` - The 6-character room code (required)
  - Example: `/game.html?room=ABC123`

## Technical Details

### Architecture
- **board.js** - Handles board rendering and visual updates
- **game.js** - Main game logic and state management
- **chat.js** - Chat interface and messaging
- **socketClient.js** - WebSocket communication (reused from existing code)

### State Management
- Game state is managed on the server
- Client receives state updates via WebSocket events
- UI updates in response to server events

### Events Handled
- `game-started` - Initialize game board
- `dice-rolled` - Update dice and move player
- `property-bought` - Update ownership indicators
- `turn-changed` - Switch to next player
- `building-built` - Show houses/hotels
- `property-mortgaged` - Update mortgage status
- `chat-message` - Display chat messages
- And more...

## Browser Compatibility

- Modern browsers with ES6 support
- WebSocket support required
- Tested on Chrome, Firefox, Safari, Edge

## Dependencies

- Socket.IO client (4.6.1) - WebSocket communication
- Tailwind CSS (CDN) - Styling
- No other external dependencies

## Development

To run locally:

1. Start the server: `cd server && npm start`
2. Open browser to `http://localhost:3000`
3. Create a room and start playing

## Notes

- Room code must be provided in URL
- Minimum 2 players required to start
- Maximum 8 players per game
- Game automatically handles disconnections
- Chat messages limited to 200 characters
