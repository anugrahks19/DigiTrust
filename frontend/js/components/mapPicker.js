// ====================================
// Map Picker Component
// ====================================

let map = null;
let selectedDigipin = null;
let selectedMarker = null;

// Sample DIGIPIN grid overlay coordinates
const digipinGridSamples = [
    { digipin: 'AB12-CD34-EF', lat: 10.5276, lng: 76.2144, locality: 'Sector 2', city: 'Thrissur' },
    { digipin: 'AB12-CD34-FG', lat: 10.5285, lng: 76.2156, locality: 'Ambedkar Nagar East', city: 'Thrissur' },
    { digipin: 'DL01-MN45-XY', lat: 28.7041, lng: 77.1025, locality: 'Connaught Place', city: 'Delhi' },
    { digipin: 'MH01-QR78-EF', lat: 19.0760, lng: 72.8777, locality: 'Andheri West', city: 'Mumbai' },
    { digipin: 'KA01-ST12-HI', lat: 12.9716, lng: 77.5946, locality: 'Koramangala', city: 'Bangalore' },
];

function initMap() {
    // Create map centered on India
    map = L.map('map').setView([20.5937, 78.9629], 5);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);

    // Add DIGIPIN grid markers
    digipinGridSamples.forEach(cell => {
        const marker = L.marker([cell.lat, cell.lng], {
            icon: L.divIcon({
                className: 'digipin-marker',
                html: `
                    <div style="
                        background: linear-gradient(135deg, hsl(240, 85%, 60%), hsl(280, 75%, 65%));
                        color: white;
                        padding: 4px 8px;
                        border-radius: 6px;
                        font-size: 11px;
                        font-weight: 700;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                        white-space: nowrap;
                    ">${cell.digipin}</div>
                `,
                iconSize: [100, 30],
                iconAnchor: [50, 15]
            })
        }).addTo(map);

        marker.on('click', () => {
            selectDigipinCell(cell);
        });
    });

    // Add click listener for map
    map.on('click', (e) => {
        // Find nearest DIGIPIN cell
        const nearest = findNearestDigipin(e.latlng.lat, e.latlng.lng);
        if (nearest) {
            selectDigipinCell(nearest);
        }
    });
}

function findNearestDigipin(lat, lng) {
    let nearest = null;
    let minDistance = Infinity;

    digipinGridSamples.forEach(cell => {
        const distance = Math.sqrt(
            Math.pow(cell.lat - lat, 2) + Math.pow(cell.lng - lng, 2)
        );
        if (distance < minDistance) {
            minDistance = distance;
            nearest = cell;
        }
    });

    return nearest;
}

function selectDigipinCell(cell) {
    selectedDigipin = cell;

    // Remove previous marker
    if (selectedMarker) {
        map.removeLayer(selectedMarker);
    }

    // Add selection marker
    selectedMarker = L.marker([cell.lat, cell.lng], {
        icon: L.divIcon({
            className: 'selection-marker',
            html: `
                <div style="
                    width: 40px;
                    height: 40px;
                    background: linear-gradient(135deg, hsl(320, 85%, 65%), hsl(240, 85%, 60%));
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    animation: pulse 1.5s ease-in-out infinite;
                "></div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        })
    }).addTo(map);

    // Pan to location
    map.setView([cell.lat, cell.lng], 12);

    // Update instruction
    document.querySelector('.map-instruction').innerHTML = `
        <strong>Selected:</strong> ${cell.digipin} - ${cell.locality}, ${cell.city}
    `;
}

function openMapPicker() {
    const modal = document.getElementById('mapModal');
    modal.classList.add('active');

    // Initialize map if not already done
    if (!map) {
        setTimeout(() => {
            initMap();
        }, 100);
    } else {
        map.invalidateSize();
    }
}

function closeMapPicker() {
    const modal = document.getElementById('mapModal');
    modal.classList.remove('active');
}

function confirmMapSelection() {
    if (selectedDigipin) {
        // Auto-fill form fields
        document.getElementById('digipin').value = selectedDigipin.digipin;
        document.getElementById('locality').value = selectedDigipin.locality;
        document.getElementById('city').value = selectedDigipin.city;

        showNotification(`DIGIPIN ${selectedDigipin.digipin} selected!`, 'success');
    }
    closeMapPicker();
}

// Event listeners
document.getElementById('mapPickerBtn').addEventListener('click', () => {
    openMapPicker();
});

document.getElementById('modalClose').addEventListener('click', closeMapPicker);
document.getElementById('mapCancelBtn').addEventListener('click', closeMapPicker);
document.getElementById('mapConfirmBtn').addEventListener('click', confirmMapSelection);

// Close modal on backdrop click
document.getElementById('mapModal').addEventListener('click', (e) => {
    if (e.target.id === 'mapModal') {
        closeMapPicker();
    }
});
