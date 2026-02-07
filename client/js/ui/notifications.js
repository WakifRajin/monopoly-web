/**
 * Notifications
 * Toast notification system
 */

class Notifications {
    constructor() {
        this.toast = Helpers.$('notification-toast');
        this.message = Helpers.$('notification-message');
        this.timeout = null;
    }

    /**
     * Show notification
     */
    show(message, type = 'info', duration = 3000) {
        if (!this.toast || !this.message) {
            console.warn('Notification elements not found');
            return;
        }

        // Clear previous timeout
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        // Set message
        this.message.textContent = message;

        // Remove all toast type classes
        this.toast.className = 'fixed bottom-4 right-4';
        
        // Add appropriate class based on type
        const toastDiv = this.toast.querySelector('div');
        if (toastDiv) {
            toastDiv.className = `px-6 py-4 rounded-lg shadow-xl toast-${type}`;
        }

        // Show toast
        Helpers.show(this.toast);

        // Auto-hide after duration
        if (duration > 0) {
            this.timeout = setTimeout(() => {
                this.hide();
            }, duration);
        }
    }

    /**
     * Hide notification
     */
    hide() {
        if (this.toast) {
            Helpers.hide(this.toast);
        }
    }

    /**
     * Show success notification
     */
    success(message, duration = 3000) {
        this.show(message, CONSTANTS.NOTIFICATION_TYPES.SUCCESS, duration);
    }

    /**
     * Show error notification
     */
    error(message, duration = 5000) {
        this.show(message, CONSTANTS.NOTIFICATION_TYPES.ERROR, duration);
    }

    /**
     * Show warning notification
     */
    warning(message, duration = 4000) {
        this.show(message, CONSTANTS.NOTIFICATION_TYPES.WARNING, duration);
    }

    /**
     * Show info notification
     */
    info(message, duration = 3000) {
        this.show(message, CONSTANTS.NOTIFICATION_TYPES.INFO, duration);
    }
}

// Create global notifications instance
if (typeof window !== 'undefined') {
    window.notifications = new Notifications();
}
