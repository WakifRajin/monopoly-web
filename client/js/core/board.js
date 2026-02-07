/**
 * Board Class
 * Handles board rendering, player positioning, and visual updates
 */

class Board {
    constructor(boardElementId) {
        this.boardElement = document.getElementById(boardElementId);
        this.spaces = [];
        this.playerMarkers = new Map();
        this.boardData = this.getBoardData();
        
        this.initialize();
    }

    /**
     * Get the board space definitions (Bangladeshi theme)
     */
    getBoardData() {
        return [
            { index: 0, name: "শুরু (Go)", type: "go" },
            { index: 1, name: "পুরান ঢাকা", price: 600, rent: [20, 100, 300, 900, 1600, 2500], group: "Brown", type: "property", color: "bg-yellow-800", buildCost: 500 },
            { index: 2, name: "কমিউনিটি চেস্ট", type: "community-chest" },
            { index: 3, name: "লালবাগ কেল্লা", price: 600, rent: [40, 200, 600, 1800, 3200, 4500], group: "Brown", type: "property", color: "bg-yellow-800", buildCost: 500 },
            { index: 4, name: "আয়কর", type: "tax", amount: 2000 },
            { index: 5, name: "কমলাপুর স্টেশন", price: 2000, rent: [250, 500, 1000, 2000], type: "station" },
            { index: 6, name: "মতিঝিল", price: 1000, rent: [60, 300, 900, 2700, 4000, 5500], group: "LightBlue", type: "property", color: "bg-sky-300", buildCost: 500 },
            { index: 7, name: "চান্স", type: "chance" },
            { index: 8, name: "দিলকুশা", price: 1000, rent: [60, 300, 900, 2700, 4000, 5500], group: "LightBlue", type: "property", color: "bg-sky-300", buildCost: 500 },
            { index: 9, name: "নয়া পল্টন", price: 1200, rent: [80, 400, 1000, 3000, 4500, 6000], group: "LightBlue", type: "property", color: "bg-sky-300", buildCost: 500 },
            { index: 10, name: "জেল (Jail)", type: "jail" },
            { index: 11, name: "ফার্মগেট", price: 1400, rent: [100, 500, 1500, 4500, 6250, 7500], group: "Pink", type: "property", color: "bg-pink-500", buildCost: 1000 },
            { index: 12, name: "বিদ্যুৎ", price: 1500, type: "utility" },
            { index: 13, name: "এলিফ্যান্ট রোড", price: 1400, rent: [100, 500, 1500, 4500, 6250, 7500], group: "Pink", type: "property", color: "bg-pink-500", buildCost: 1000 },
            { index: 14, name: "নিউ মার্কেট", price: 1600, rent: [120, 600, 1800, 5000, 7000, 9000], group: "Pink", type: "property", color: "bg-pink-500", buildCost: 1000 },
            { index: 15, name: "বিমানবন্দর স্টেশন", price: 2000, rent: [250, 500, 1000, 2000], type: "station" },
            { index: 16, name: "ধানমন্ডি", price: 1800, rent: [140, 700, 2000, 5500, 7500, 9500], group: "Orange", type: "property", color: "bg-orange-500", buildCost: 1000 },
            { index: 17, name: "কমিউনিটি চেস্ট", type: "community-chest" },
            { index: 18, name: "মোহাম্মদপুর", price: 1800, rent: [140, 700, 2000, 5500, 7500, 9500], group: "Orange", type: "property", color: "bg-orange-500", buildCost: 1000 },
            { index: 19, name: "শ্যামলী", price: 2000, rent: [160, 800, 2200, 6000, 8000, 10000], group: "Orange", type: "property", color: "bg-orange-500", buildCost: 1000 },
            { index: 20, name: "ফ্রি পার্কিং", type: "free-parking" },
            { index: 21, name: "গুলশান", price: 2200, rent: [180, 900, 2500, 7000, 8750, 10500], group: "Red", type: "property", color: "bg-red-500", buildCost: 1500 },
            { index: 22, name: "চান্স", type: "chance" },
            { index: 23, name: "বনানী", price: 2200, rent: [180, 900, 2500, 7000, 8750, 10500], group: "Red", type: "property", color: "bg-red-500", buildCost: 1500 },
            { index: 24, name: "বারিধারা", price: 2400, rent: [200, 1000, 3000, 7500, 9250, 11000], group: "Red", type: "property", color: "bg-red-500", buildCost: 1500 },
            { index: 25, name: "চট্টগ্রাম স্টেশন", price: 2000, rent: [250, 500, 1000, 2000], type: "station" },
            { index: 26, name: "উত্তরা", price: 2600, rent: [220, 1100, 3300, 8000, 9750, 11500], group: "Yellow", type: "property", color: "bg-yellow-400", buildCost: 1500 },
            { index: 27, name: "মিরপুর", price: 2600, rent: [220, 1100, 3300, 8000, 9750, 11500], group: "Yellow", type: "property", color: "bg-yellow-400", buildCost: 1500 },
            { index: 28, name: "পানি সরবরাহ", price: 1500, type: "utility" },
            { index: 29, name: "বসুন্ধরা", price: 2800, rent: [240, 1200, 3600, 8500, 10250, 12000], group: "Yellow", type: "property", color: "bg-yellow-400", buildCost: 1500 },
            { index: 30, name: "জেলে যাও", type: "go-to-jail" },
            { index: 31, name: "কক্সবাজার", price: 3000, rent: [260, 1300, 3900, 9000, 11000, 13000], group: "Green", type: "property", color: "bg-green-600", buildCost: 2000 },
            { index: 32, name: "সেন্ট মার্টিন", price: 3000, rent: [260, 1300, 3900, 9000, 11000, 13000], group: "Green", type: "property", color: "bg-green-600", buildCost: 2000 },
            { index: 33, name: "কমিউনিটি চেস্ট", type: "community-chest" },
            { index: 34, name: "বান্দরবান", price: 3200, rent: [280, 1500, 4500, 10000, 12000, 14000], group: "Green", type: "property", color: "bg-green-600", buildCost: 2000 },
            { index: 35, name: "সিলেট স্টেশন", price: 2000, rent: [250, 500, 1000, 2000], type: "station" },
            { index: 36, name: "চান্স", type: "chance" },
            { index: 37, name: "শ্রীমঙ্গল", price: 3500, rent: [350, 1750, 5000, 11000, 13000, 15000], group: "DarkBlue", type: "property", color: "bg-blue-800", buildCost: 2000 },
            { index: 38, name: "বিলাস কর", type: "tax", amount: 1000 },
            { index: 39, name: "জাফলং", price: 4000, rent: [500, 2000, 6000, 14000, 17000, 20000], group: "DarkBlue", type: "property", color: "bg-blue-800", buildCost: 2000 },
        ];
    }

    /**
     * Initialize the board
     */
    initialize() {
        this.renderBoard();
    }

    /**
     * Render all board spaces
     */
    renderBoard() {
        this.boardData.forEach((space, index) => {
            const spaceElement = this.createSpaceElement(space, index);
            this.boardElement.appendChild(spaceElement);
            this.spaces.push(spaceElement);
        });
    }

    /**
     * Create a space element
     */
    createSpaceElement(space, index) {
        const spaceDiv = document.createElement('div');
        spaceDiv.id = `space-${index}`;
        spaceDiv.className = 'space';
        spaceDiv.dataset.index = index;
        spaceDiv.dataset.type = space.type;

        // Add corner class for corner spaces
        if ([0, 10, 20, 30].includes(index)) {
            spaceDiv.classList.add('corner');
        }

        // Create space content based on type
        if (space.type === 'property') {
            spaceDiv.innerHTML = `
                <div class="property-color ${space.color}"></div>
                <div class="space-name">${space.name}</div>
                <div class="space-price">৳${space.price}</div>
            `;
        } else if (space.type === 'station') {
            spaceDiv.innerHTML = `
                <div class="space-name">🚂<br>${space.name}</div>
                <div class="space-price">৳${space.price}</div>
            `;
        } else if (space.type === 'utility') {
            spaceDiv.innerHTML = `
                <div class="space-name">⚡<br>${space.name}</div>
                <div class="space-price">৳${space.price}</div>
            `;
        } else if (space.type === 'tax') {
            spaceDiv.innerHTML = `
                <div class="space-name">${space.name}</div>
                <div class="space-price">৳${space.amount}</div>
            `;
        } else {
            spaceDiv.innerHTML = `<div class="space-name">${space.name}</div>`;
        }

        // Add click handler to show property details
        spaceDiv.addEventListener('click', () => this.onSpaceClick(space, index));

        return spaceDiv;
    }

    /**
     * Handle space click
     */
    onSpaceClick(space, index) {
        if (space.type === 'property' || space.type === 'station' || space.type === 'utility') {
            this.showPropertyDetails(space, index);
        }
    }

    /**
     * Show property details modal
     */
    showPropertyDetails(space, index) {
        const modal = document.getElementById('property-modal');
        const propertyName = document.getElementById('property-name');
        const propertyDetails = document.getElementById('property-details');

        propertyName.textContent = space.name;
        
        let detailsHTML = `<p><strong>Price:</strong> ৳${space.price}</p>`;
        
        if (space.type === 'property') {
            detailsHTML += `<p><strong>Group:</strong> ${space.group}</p>`;
            detailsHTML += `<p><strong>Rent:</strong></p>`;
            detailsHTML += `<ul class="ml-4 text-xs">`;
            detailsHTML += `<li>Base: ৳${space.rent[0]}</li>`;
            detailsHTML += `<li>1 House: ৳${space.rent[1]}</li>`;
            detailsHTML += `<li>2 Houses: ৳${space.rent[2]}</li>`;
            detailsHTML += `<li>3 Houses: ৳${space.rent[3]}</li>`;
            detailsHTML += `<li>4 Houses: ৳${space.rent[4]}</li>`;
            detailsHTML += `<li>Hotel: ৳${space.rent[5]}</li>`;
            detailsHTML += `</ul>`;
            detailsHTML += `<p><strong>Build Cost:</strong> ৳${space.buildCost}</p>`;
        } else if (space.type === 'station') {
            detailsHTML += `<p><strong>Rent:</strong></p>`;
            detailsHTML += `<ul class="ml-4 text-xs">`;
            detailsHTML += `<li>1 Station: ৳${space.rent[0]}</li>`;
            detailsHTML += `<li>2 Stations: ৳${space.rent[1]}</li>`;
            detailsHTML += `<li>3 Stations: ৳${space.rent[2]}</li>`;
            detailsHTML += `<li>4 Stations: ৳${space.rent[3]}</li>`;
            detailsHTML += `</ul>`;
        } else if (space.type === 'utility') {
            detailsHTML += `<p class="text-xs">Rent is 4x dice roll if one utility owned, 10x if both owned.</p>`;
        }

        propertyDetails.innerHTML = detailsHTML;
        modal.classList.remove('hidden');
    }

    /**
     * Create or update player marker
     */
    updatePlayerPosition(playerId, position, color, token) {
        let marker = this.playerMarkers.get(playerId);
        
        if (!marker) {
            marker = this.createPlayerMarker(playerId, color, token);
            this.playerMarkers.set(playerId, marker);
            this.boardElement.appendChild(marker);
        }

        // Calculate position on board
        const coords = this.getSpaceCoordinates(position, this.playerMarkers.size - 1);
        marker.style.left = coords.x + 'px';
        marker.style.top = coords.y + 'px';
    }

    /**
     * Create player marker element
     */
    createPlayerMarker(playerId, color, token) {
        const marker = document.createElement('div');
        marker.className = 'player-marker';
        marker.id = `player-marker-${playerId}`;
        marker.style.backgroundColor = color;
        marker.textContent = token;
        return marker;
    }

    /**
     * Get coordinates for a space position
     */
    getSpaceCoordinates(spaceIndex, playerOffset = 0) {
        const space = this.spaces[spaceIndex];
        if (!space) return { x: 0, y: 0 };

        const rect = space.getBoundingClientRect();
        const boardRect = this.boardElement.getBoundingClientRect();

        // Calculate base position (center of space)
        let x = rect.left - boardRect.left + (rect.width / 2) - 10;
        let y = rect.top - boardRect.top + (rect.height / 2) - 10;

        // Offset multiple players on same space
        const offsetAmount = 15;
        const angle = (playerOffset * Math.PI) / 4;
        x += Math.cos(angle) * offsetAmount;
        y += Math.sin(angle) * offsetAmount;

        return { x, y };
    }

    /**
     * Update property ownership indicator
     */
    updatePropertyOwnership(spaceIndex, ownerColor) {
        const space = this.spaces[spaceIndex];
        if (!space) return;

        // Remove existing ownership marker
        const existingMarker = space.querySelector('.ownership-marker');
        if (existingMarker) {
            existingMarker.remove();
        }

        // Add new ownership marker if there's an owner
        if (ownerColor) {
            const marker = document.createElement('div');
            marker.className = 'ownership-marker';
            marker.style.backgroundColor = ownerColor;
            space.appendChild(marker);
        }
    }

    /**
     * Update building indicators (houses/hotels)
     */
    updateBuildings(spaceIndex, houses, hotel) {
        const space = this.spaces[spaceIndex];
        if (!space) return;

        // Remove existing building indicator
        const existingIndicator = space.querySelector('.building-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Add new building indicator if there are buildings
        if (houses > 0 || hotel) {
            const indicator = document.createElement('div');
            indicator.className = 'building-indicator';
            indicator.textContent = hotel ? '🏨' : `🏠${houses}`;
            space.appendChild(indicator);
        }
    }

    /**
     * Remove player marker
     */
    removePlayerMarker(playerId) {
        const marker = this.playerMarkers.get(playerId);
        if (marker) {
            marker.remove();
            this.playerMarkers.delete(playerId);
        }
    }

    /**
     * Get space data by index
     */
    getSpaceData(index) {
        return this.boardData[index];
    }

    /**
     * Highlight a space
     */
    highlightSpace(spaceIndex, duration = 2000) {
        const space = this.spaces[spaceIndex];
        if (!space) return;

        space.style.backgroundColor = '#ffeb3b';
        setTimeout(() => {
            space.style.backgroundColor = '';
        }, duration);
    }
}

// Make Board available globally
if (typeof window !== 'undefined') {
    window.Board = Board;
}
