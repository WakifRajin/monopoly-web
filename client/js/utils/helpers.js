/**
 * Helper Functions
 * Utility functions used throughout the application
 */

const Helpers = {
    /**
     * Format money with Bangladeshi Taka symbol
     */
    formatMoney(amount) {
        return `৳${amount.toLocaleString()}`;
    },

    /**
     * Generate a random ID
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Get element by ID safely
     */
    $(id) {
        return document.getElementById(id);
    },

    /**
     * Show element
     */
    show(element) {
        if (typeof element === 'string') {
            element = this.$(element);
        }
        if (element) {
            element.classList.remove('hidden');
        }
    },

    /**
     * Hide element
     */
    hide(element) {
        if (typeof element === 'string') {
            element = this.$(element);
        }
        if (element) {
            element.classList.add('hidden');
        }
    },

    /**
     * Toggle element visibility
     */
    toggle(element) {
        if (typeof element === 'string') {
            element = this.$(element);
        }
        if (element) {
            element.classList.toggle('hidden');
        }
    },

    /**
     * Add class to element
     */
    addClass(element, className) {
        if (typeof element === 'string') {
            element = this.$(element);
        }
        if (element) {
            element.classList.add(className);
        }
    },

    /**
     * Remove class from element
     */
    removeClass(element, className) {
        if (typeof element === 'string') {
            element = this.$(element);
        }
        if (element) {
            element.classList.remove(className);
        }
    },

    /**
     * Format timestamp to readable time
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    },

    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Failed to copy:', err);
            return false;
        }
    },

    /**
     * Validate room code format
     */
    isValidRoomCode(code) {
        return /^[A-Z0-9]{6}$/.test(code);
    },

    /**
     * Validate player name
     */
    isValidPlayerName(name) {
        return name && name.trim().length >= 1 && name.trim().length <= 20;
    }
};

// Make helpers available globally
if (typeof window !== 'undefined') {
    window.Helpers = Helpers;
}
