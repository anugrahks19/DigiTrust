// ====================================
// Address Form & Demo Data Handler
// ====================================

// Demo Address Data
const DEMO_DATA = {
    high: {
        houseNo: '42/A',
        street: 'MG Road',
        locality: 'Indira Nagar',
        city: 'Bangalore',
        district: 'Bangalore Urban',
        state: 'Karnataka',
        pin: '560038',
        digipin: 'BG-5600-38-IN'
    },
    medium: {
        houseNo: '12-B',
        street: 'Market Road',
        locality: 'Sector 4',
        city: 'Noida',
        district: 'Gautam Buddha Nagar',
        state: 'Uttar Pradesh',
        pin: '201301',
        digipin: 'ND-2013-01-S4'
    },
    low: {
        houseNo: 'Plot 7',
        street: 'Unmapped Road',
        locality: 'Village Outskirts',
        city: 'Remote Town',
        district: 'Rural District',
        state: 'Madhya Pradesh',
        pin: '450001',
        digipin: 'MP-4500-01-XX'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setupFormSubmission();
    setupDemoCards();
});

// ====================================
// Form Submission Logic
// ====================================

// Loading Texts
const LOADING_TEXTS = [
    "Tracing your address…",
    "Asking satellites… brb.",
    "Matching house vibes…",
    "Checking your grid square…",
    "Finding digital footprints…",
    "Looking around your locality…",
    "Talking to our servers… they’re shy.",
    "Verifying your spot on Earth…",
    "Cross-checking signals…",
    "Scoring your address… almost done!"
];

function setupFormSubmission() {
    const form = document.getElementById('addressForm');

    if (!form) return;

    // Inject Loading CSS
    injectLoadingStyles();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // AUTH CHECK: Ensure user is logged in
        if (!localStorage.getItem('auth_token')) {
            alert("Please login to validate address!");
            window.location.href = '/login.html';
            return;
        }

        // Show Custom Loader
        const loaderOverlay = createLoaderOverlay();
        document.body.appendChild(loaderOverlay);

        let textIndex = 0;
        const textElement = loaderOverlay.querySelector('.loader-text');

        // Rotate text every 3 seconds
        const textInterval = setInterval(() => {
            textIndex = (textIndex + 1) % LOADING_TEXTS.length;
            textElement.style.opacity = '0';
            setTimeout(() => {
                textElement.textContent = LOADING_TEXTS[textIndex];
                textElement.style.opacity = '1';
            }, 300);
        }, 3000);

        // Minimum wait time promise (12 seconds)
        const waitPromise = new Promise(resolve => setTimeout(resolve, 12000));

        try {
            // Gather form data
            const formData = {
                user_id: document.getElementById('userId').value,
                address: {
                    house_no: document.getElementById('houseNo').value,
                    street: document.getElementById('street').value,
                    locality: document.getElementById('locality').value,
                    city: document.getElementById('city').value,
                    district: document.getElementById('district').value,
                    state: document.getElementById('state').value,
                    pin: document.getElementById('pin').value,
                    digipin: document.getElementById('digipin').value
                },
                consent: {
                    consented: document.getElementById('consentCheck').checked,
                    timestamp: new Date().toISOString(),
                    ip_address: '127.0.0.1', // Client-side simulation
                    purpose: 'KYC'
                }
            };

            // Call API
            const apiPromise = apiRequest('/api/validate', 'POST', formData);

            // Wait for both API and 12s timer
            const [result] = await Promise.all([apiPromise, waitPromise]);

            // Store result in global state
            appState.lastValidationResult = result;

            // Cleanup Loader
            clearInterval(textInterval);
            loaderOverlay.style.opacity = '0';
            setTimeout(() => {
                loaderOverlay.remove();
                // Switch to result view
                displayValidationResult(result);
                switchView('result');
            }, 500);

        } catch (error) {
            console.error('Validation failed:', error);
            clearInterval(textInterval);
            loaderOverlay.remove();
            // Error handling is managed by apiRequest notification, 
            // but we ensure loader is gone.
        }
    });
}

function createLoaderOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'custom-loader-overlay glass-morphism';
    overlay.innerHTML = `
        <div class="loading-card glass">
            <div class="custom-spinner"></div>
            <p class="loader-text">${LOADING_TEXTS[0]}</p>
        </div>
    `;
    return overlay;
}

function injectLoadingStyles() {
    if (document.getElementById('custom-loader-style')) return;

    const style = document.createElement('style');
    style.id = 'custom-loader-style';
    style.textContent = `
        .custom-loader-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: opacity 0.5s ease;
        }
        
        .loading-card {
            padding: 3rem;
            border-radius: 24px;
            text-align: center;
            min-width: 320px;
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
        }
        
        .custom-spinner {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(255, 255, 255, 0.1);
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        .loader-text {
            font-size: 1.1rem;
            font-weight: 500;
            color: var(--text-primary);
            min-height: 1.5em; /* Prevent layout shift */
            transition: opacity 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}

// ====================================
// Demo Card Logic
// ====================================

function setupDemoCards() {
    const demoCards = document.querySelectorAll('.demo-card');

    demoCards.forEach(card => {
        card.addEventListener('click', () => {
            const demoType = card.dataset.demo;
            const data = DEMO_DATA[demoType];

            if (data) {
                fillAddressForm(data);

                // Visual feedback
                // Remove active class from all
                demoCards.forEach(c => c.style.transform = 'none');

                // Add click effect
                card.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    card.style.transform = '';
                    showNotification(`Populated ${demoType} score demo address`, 'success');
                }, 150);
            }
        });
    });
}

function fillAddressForm(data) {
    document.getElementById('houseNo').value = data.houseNo;
    document.getElementById('street').value = data.street;
    document.getElementById('locality').value = data.locality;
    document.getElementById('city').value = data.city;
    document.getElementById('district').value = data.district;
    document.getElementById('state').value = data.state;
    document.getElementById('pin').value = data.pin;
    document.getElementById('digipin').value = data.digipin;

    // Auto-check consent for smoother demo
    document.getElementById('consentCheck').checked = true;

    // Scroll to form top
    document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
}
