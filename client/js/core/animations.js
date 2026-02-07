/**
 * Animations Module
 * Handles game animations and visual effects
 */

class Animations {
    constructor() {
        this.diceAnimationDuration = 800;
        this.tokenMovementSpeed = 300; // ms per space
    }

    /**
     * Animate dice roll with 3D effect
     */
    animateDiceRoll(dice1Element, dice2Element, finalValues, callback) {
        const startTime = Date.now();
        const duration = this.diceAnimationDuration;
        
        // Add rolling class for animation
        dice1Element.classList.add('dice-rolling');
        dice2Element.classList.add('dice-rolling');
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progress < 1) {
                // Show random values during animation
                const randomValue1 = Math.floor(Math.random() * 6) + 1;
                const randomValue2 = Math.floor(Math.random() * 6) + 1;
                
                dice1Element.setAttribute('data-value', randomValue1);
                dice2Element.setAttribute('data-value', randomValue2);
                
                requestAnimationFrame(animate);
            } else {
                // Show final values
                dice1Element.setAttribute('data-value', finalValues[0]);
                dice2Element.setAttribute('data-value', finalValues[1]);
                
                dice1Element.classList.remove('dice-rolling');
                dice2Element.classList.remove('dice-rolling');
                
                if (callback) callback();
            }
        };
        
        animate();
    }

    /**
     * Animate player token movement
     */
    animateTokenMovement(tokenElement, fromPosition, toPosition, board, callback) {
        const totalSpaces = 40;
        let currentPosition = fromPosition;
        
        const moveOneSpace = () => {
            if (currentPosition === toPosition) {
                if (callback) callback();
                return;
            }
            
            // Calculate next position
            currentPosition = (currentPosition + 1) % totalSpaces;
            
            // Get the space element
            const spaceElement = document.getElementById(`space-${currentPosition}`);
            if (spaceElement) {
                const rect = spaceElement.getBoundingClientRect();
                const boardRect = board.getBoundingClientRect();
                
                // Calculate position relative to board
                const left = rect.left - boardRect.left + (rect.width / 2) - 10;
                const top = rect.top - boardRect.top + (rect.height / 2) - 10;
                
                tokenElement.style.left = `${left}px`;
                tokenElement.style.top = `${top}px`;
            }
            
            // Continue to next space
            setTimeout(moveOneSpace, this.tokenMovementSpeed);
        };
        
        moveOneSpace();
    }

    /**
     * Animate money change
     */
    animateMoneyChange(element, oldAmount, newAmount, duration = 1000) {
        const startTime = Date.now();
        const difference = newAmount - oldAmount;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentAmount = Math.floor(oldAmount + (difference * easeOut));
            
            element.textContent = `৳${currentAmount.toLocaleString()}`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = `৳${newAmount.toLocaleString()}`;
            }
        };
        
        animate();
    }

    /**
     * Show property purchase animation
     */
    showPropertyPurchase(propertyElement, playerColor) {
        propertyElement.style.animation = 'property-purchased 0.6s ease-out';
        
        setTimeout(() => {
            propertyElement.style.animation = '';
        }, 600);
    }

    /**
     * Show rent payment animation
     */
    showRentPayment(fromElement, toElement, amount) {
        // Create a floating money indicator
        const moneyIndicator = document.createElement('div');
        moneyIndicator.textContent = `-৳${amount}`;
        moneyIndicator.style.position = 'fixed';
        moneyIndicator.style.color = 'red';
        moneyIndicator.style.fontWeight = 'bold';
        moneyIndicator.style.fontSize = '1.5rem';
        moneyIndicator.style.zIndex = '1000';
        moneyIndicator.style.pointerEvents = 'none';
        moneyIndicator.style.animation = 'float-up 1.5s ease-out forwards';
        
        const fromRect = fromElement.getBoundingClientRect();
        moneyIndicator.style.left = `${fromRect.left}px`;
        moneyIndicator.style.top = `${fromRect.top}px`;
        
        document.body.appendChild(moneyIndicator);
        
        setTimeout(() => {
            moneyIndicator.remove();
        }, 1500);
    }

    /**
     * Highlight active player
     */
    highlightActivePlayer(playerElement) {
        // Remove highlight from all players
        document.querySelectorAll('.player-info').forEach(el => {
            el.classList.remove('active-player');
        });
        
        // Add highlight to active player
        if (playerElement) {
            playerElement.classList.add('active-player');
            
            // Scroll into view if needed
            playerElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    /**
     * Show notification toast
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `fixed top-20 right-4 px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in`;
        
        const colors = {
            info: 'bg-blue-500 text-white',
            success: 'bg-green-500 text-white',
            warning: 'bg-yellow-500 text-white',
            error: 'bg-red-500 text-white'
        };
        
        toast.className += ` ${colors[type] || colors.info}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slide-out 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    /**
     * Show building construction animation
     */
    showBuildingConstruction(propertyElement, buildingType) {
        const indicator = document.createElement('div');
        indicator.className = 'building-construction-indicator';
        indicator.textContent = buildingType === 'hotel' ? '🏨' : '🏠';
        indicator.style.position = 'absolute';
        indicator.style.fontSize = '2rem';
        indicator.style.zIndex = '100';
        indicator.style.animation = 'build-animation 1s ease-out';
        
        const rect = propertyElement.getBoundingClientRect();
        indicator.style.left = `${rect.left + rect.width / 2}px`;
        indicator.style.top = `${rect.top}px`;
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            indicator.remove();
        }, 1000);
    }

    /**
     * Shake animation for errors or invalid actions
     */
    shakeElement(element) {
        element.style.animation = 'shake 0.5s ease-out';
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    }

    /**
     * Pulse animation for important elements
     */
    pulseElement(element, duration = 2000) {
        element.style.animation = `pulse 1s ease-in-out infinite`;
        
        if (duration > 0) {
            setTimeout(() => {
                element.style.animation = '';
            }, duration);
        }
    }

    /**
     * Celebration animation for game winner
     */
    showWinnerCelebration(winnerName) {
        // Create confetti effect
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                this.createConfetti();
            }, i * 30);
        }
        
        // Show winner announcement
        const announcement = document.createElement('div');
        announcement.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50';
        announcement.innerHTML = `
            <div class="bg-white p-8 rounded-lg shadow-2xl text-center animate-bounce-in">
                <div class="text-6xl mb-4">🎉</div>
                <h2 class="text-4xl font-bold mb-2">Winner!</h2>
                <p class="text-2xl text-gray-700">${winnerName}</p>
                <p class="text-gray-500 mt-4">Congratulations!</p>
            </div>
        `;
        
        document.body.appendChild(announcement);
        
        return announcement;
    }

    /**
     * Create confetti particle
     */
    createConfetti() {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        confetti.style.backgroundColor = this.getRandomColor();
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }

    /**
     * Get random color for confetti
     */
    getRandomColor() {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes dice-rolling {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(90deg); }
        50% { transform: rotate(180deg); }
        75% { transform: rotate(270deg); }
    }

    .dice-rolling {
        animation: dice-rolling 0.1s linear infinite;
    }

    @keyframes property-purchased {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); box-shadow: 0 0 20px rgba(34, 197, 94, 0.6); }
        100% { transform: scale(1); }
    }

    @keyframes float-up {
        0% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-100px); }
    }

    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }

    @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
    }

    @keyframes slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slide-out {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }

    @keyframes bounce-in {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); opacity: 1; }
    }

    @keyframes build-animation {
        0% { transform: translateY(0) scale(0); opacity: 0; }
        50% { transform: translateY(-50px) scale(1.5); opacity: 1; }
        100% { transform: translateY(-100px) scale(0); opacity: 0; }
    }

    .confetti {
        position: fixed;
        width: 10px;
        height: 10px;
        top: -10px;
        z-index: 1000;
        animation: confetti-fall linear forwards;
        pointer-events: none;
    }

    @keyframes confetti-fall {
        to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Make Animations available globally
if (typeof window !== 'undefined') {
    window.Animations = Animations;
}
