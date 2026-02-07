/**
 * Property Card Component
 * Displays detailed property information in a modal
 */

class PropertyCard {
    constructor() {
        this.modal = document.getElementById('property-modal');
        this.propertyName = document.getElementById('property-name');
        this.propertyDetails = document.getElementById('property-details');
        this.closeButton = document.getElementById('close-property-modal');
        
        this.initialize();
    }

    /**
     * Initialize the property card
     */
    initialize() {
        this.closeButton.addEventListener('click', () => this.hide());
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.hide();
            }
        });
        
        // Close on background click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });
    }

    /**
     * Show property card for a given property
     */
    show(property, gameState = null) {
        this.propertyName.textContent = property.name;
        
        let detailsHTML = '';
        
        if (property.type === 'property') {
            detailsHTML = this.renderPropertyDetails(property, gameState);
        } else if (property.type === 'station') {
            detailsHTML = this.renderStationDetails(property, gameState);
        } else if (property.type === 'utility') {
            detailsHTML = this.renderUtilityDetails(property, gameState);
        } else if (property.type === 'tax') {
            detailsHTML = this.renderTaxDetails(property);
        } else if (property.type === 'chance') {
            detailsHTML = '<p class="text-gray-700">Draw a Chance card!</p>';
        } else if (property.type === 'community-chest') {
            detailsHTML = '<p class="text-gray-700">Draw a Community Chest card!</p>';
        } else if (property.type === 'go') {
            detailsHTML = '<p class="text-gray-700">Collect ৳2000 when passing or landing on GO.</p>';
        } else if (property.type === 'jail') {
            detailsHTML = '<p class="text-gray-700">Just visiting... or in jail!</p>';
        } else if (property.type === 'free-parking') {
            detailsHTML = '<p class="text-gray-700">Free Parking! Rest easy here.</p>';
        } else if (property.type === 'go-to-jail') {
            detailsHTML = '<p class="text-gray-700 font-bold">Go directly to Jail. Do not pass GO, do not collect ৳2000.</p>';
        }
        
        this.propertyDetails.innerHTML = detailsHTML;
        this.modal.classList.remove('hidden');
    }

    /**
     * Render regular property details
     */
    renderPropertyDetails(property, gameState) {
        const ownerName = property.owner && gameState 
            ? this.getPlayerName(property.owner, gameState)
            : 'Unowned';
        
        const mortgageStatus = property.mortgaged ? ' (Mortgaged)' : '';
        const buildingInfo = property.hotels > 0 
            ? `🏨 ${property.hotels} Hotel` 
            : property.houses > 0 
                ? `🏠 ${property.houses} House${property.houses > 1 ? 's' : ''}`
                : 'No buildings';
        
        return `
            <div class="space-y-2">
                <div class="flex justify-between">
                    <span class="font-semibold">Price:</span>
                    <span>৳${property.price}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-semibold">Owner:</span>
                    <span>${ownerName}${mortgageStatus}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-semibold">Group:</span>
                    <span class="px-2 py-1 rounded ${property.color} text-white text-xs">${property.group}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-semibold">Buildings:</span>
                    <span>${buildingInfo}</span>
                </div>
                <hr class="my-2">
                <div class="font-semibold mb-1">Rent:</div>
                <div class="text-sm space-y-1 pl-2">
                    <div class="flex justify-between">
                        <span>Base rent:</span>
                        <span>৳${property.rent[0]}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>With 1 house:</span>
                        <span>৳${property.rent[1]}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>With 2 houses:</span>
                        <span>৳${property.rent[2]}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>With 3 houses:</span>
                        <span>৳${property.rent[3]}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>With 4 houses:</span>
                        <span>৳${property.rent[4]}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>With hotel:</span>
                        <span>৳${property.rent[5]}</span>
                    </div>
                </div>
                <hr class="my-2">
                <div class="flex justify-between">
                    <span class="font-semibold">Building cost:</span>
                    <span>৳${property.buildCost}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-semibold">Mortgage value:</span>
                    <span>৳${Math.floor(property.price * 0.5)}</span>
                </div>
            </div>
        `;
    }

    /**
     * Render station details
     */
    renderStationDetails(property, gameState) {
        const ownerName = property.owner && gameState 
            ? this.getPlayerName(property.owner, gameState)
            : 'Unowned';
        
        const mortgageStatus = property.mortgaged ? ' (Mortgaged)' : '';
        
        return `
            <div class="space-y-2">
                <div class="flex justify-between">
                    <span class="font-semibold">Price:</span>
                    <span>৳${property.price}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-semibold">Owner:</span>
                    <span>${ownerName}${mortgageStatus}</span>
                </div>
                <hr class="my-2">
                <div class="font-semibold mb-1">Rent:</div>
                <div class="text-sm space-y-1 pl-2">
                    <div class="flex justify-between">
                        <span>1 station owned:</span>
                        <span>৳${property.rent[0]}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>2 stations owned:</span>
                        <span>৳${property.rent[1]}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>3 stations owned:</span>
                        <span>৳${property.rent[2]}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>4 stations owned:</span>
                        <span>৳${property.rent[3]}</span>
                    </div>
                </div>
                <hr class="my-2">
                <div class="flex justify-between">
                    <span class="font-semibold">Mortgage value:</span>
                    <span>৳${Math.floor(property.price * 0.5)}</span>
                </div>
            </div>
        `;
    }

    /**
     * Render utility details
     */
    renderUtilityDetails(property, gameState) {
        const ownerName = property.owner && gameState 
            ? this.getPlayerName(property.owner, gameState)
            : 'Unowned';
        
        const mortgageStatus = property.mortgaged ? ' (Mortgaged)' : '';
        
        return `
            <div class="space-y-2">
                <div class="flex justify-between">
                    <span class="font-semibold">Price:</span>
                    <span>৳${property.price}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-semibold">Owner:</span>
                    <span>${ownerName}${mortgageStatus}</span>
                </div>
                <hr class="my-2">
                <div class="font-semibold mb-1">Rent:</div>
                <div class="text-sm space-y-1 pl-2">
                    <div class="flex justify-between">
                        <span>1 utility owned:</span>
                        <span>4 × dice roll</span>
                    </div>
                    <div class="flex justify-between">
                        <span>2 utilities owned:</span>
                        <span>10 × dice roll</span>
                    </div>
                </div>
                <hr class="my-2">
                <div class="flex justify-between">
                    <span class="font-semibold">Mortgage value:</span>
                    <span>৳${Math.floor(property.price * 0.5)}</span>
                </div>
            </div>
        `;
    }

    /**
     * Render tax details
     */
    renderTaxDetails(property) {
        return `
            <div class="space-y-2">
                <div class="flex justify-between">
                    <span class="font-semibold">Tax Amount:</span>
                    <span class="text-red-600 font-bold">৳${property.amount}</span>
                </div>
                <p class="text-gray-600 text-sm mt-2">
                    Pay the tax amount when you land on this space.
                </p>
            </div>
        `;
    }

    /**
     * Get player name from game state
     */
    getPlayerName(playerId, gameState) {
        const player = gameState.players.find(p => p.id === playerId);
        return player ? player.name : 'Unknown';
    }

    /**
     * Hide the property card
     */
    hide() {
        this.modal.classList.add('hidden');
    }
}

// Make PropertyCard available globally
if (typeof window !== 'undefined') {
    window.PropertyCard = PropertyCard;
}
