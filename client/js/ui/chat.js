/**
 * Chat Class
 * Handles chat interface and messaging
 */

class Chat {
    constructor(chatScreenId, chatInputId, sendButtonId, socketClient) {
        this.chatScreen = document.getElementById(chatScreenId);
        this.chatInput = document.getElementById(chatInputId);
        this.sendButton = document.getElementById(sendButtonId);
        this.socket = socketClient;
        
        this.initialize();
    }

    /**
     * Initialize chat
     */
    initialize() {
        this.setupEventListeners();
        this.setupSocketListeners();
    }

    /**
     * Setup UI event listeners
     */
    setupEventListeners() {
        // Send button click
        this.sendButton.addEventListener('click', () => this.sendMessage());

        // Enter key to send
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    /**
     * Setup socket event listeners
     */
    setupSocketListeners() {
        this.socket.on('chat-message', (data) => {
            this.displayMessage(data);
        });
    }

    /**
     * Send chat message
     */
    sendMessage() {
        const message = this.chatInput.value.trim();
        
        if (!message) {
            return;
        }

        // Validate message length
        if (message.length > 200) {
            this.displaySystemMessage('Message too long (max 200 characters)');
            return;
        }

        // Send to server
        this.socket.sendChatMessage(message);

        // Clear input
        this.chatInput.value = '';
    }

    /**
     * Display a chat message
     */
    displayMessage(data) {
        const { playerName, message, timestamp, playerId } = data;
        
        const messageElement = document.createElement('p');
        const time = new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        // Check if this is the current player's message
        const isOwnMessage = playerId === this.socket.getCurrentPlayerId();
        
        messageElement.innerHTML = `
            <span class="text-gray-500 text-xs">[${time}]</span>
            <span class="font-bold ${isOwnMessage ? 'text-blue-600' : 'text-gray-700'}">${playerName}:</span>
            <span class="text-gray-800">${this.escapeHtml(message)}</span>
        `;
        
        this.chatScreen.appendChild(messageElement);
        this.scrollToBottom();
    }

    /**
     * Display system message
     */
    displaySystemMessage(message) {
        const messageElement = document.createElement('p');
        messageElement.className = 'text-gray-500 italic text-sm';
        messageElement.textContent = message;
        
        this.chatScreen.appendChild(messageElement);
        this.scrollToBottom();
    }

    /**
     * Display join/leave notification
     */
    displayNotification(message, type = 'info') {
        const messageElement = document.createElement('p');
        
        if (type === 'join') {
            messageElement.className = 'text-green-600 text-sm';
        } else if (type === 'leave') {
            messageElement.className = 'text-red-600 text-sm';
        } else {
            messageElement.className = 'text-gray-600 text-sm';
        }
        
        messageElement.textContent = `• ${message}`;
        
        this.chatScreen.appendChild(messageElement);
        this.scrollToBottom();
    }

    /**
     * Scroll chat to bottom
     */
    scrollToBottom() {
        this.chatScreen.scrollTop = this.chatScreen.scrollHeight;
    }

    /**
     * Clear chat
     */
    clear() {
        this.chatScreen.innerHTML = '';
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Enable/disable chat input
     */
    setEnabled(enabled) {
        this.chatInput.disabled = !enabled;
        this.sendButton.disabled = !enabled;
    }
}

// Make Chat available globally
if (typeof window !== 'undefined') {
    window.Chat = Chat;
}
