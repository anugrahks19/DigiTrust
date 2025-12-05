// ====================================
// App Configuration & State Management
// ====================================

const API_BASE_URL = 'https://digitrust1.onrender.com/';

// Global App State
const appState = {
    currentView: 'submit',
    currentUser: 'demo_user_001',
    lastValidationResult: null,
    theme: 'light'
};

// ====================================
// Admin Authentication
// ====================================

let adminAuth = null;

// Initialize admin auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.AdminAuth) {
        adminAuth = new AdminAuth();
        window.adminAuthInstance = adminAuth; // Expose for inline handlers
        console.log('🔐 Admin Authentication Initialized');
    }
});

// ====================================
// View Management
// ====================================

function switchView(viewName) {
    // Check if accessing admin view
    if (viewName === 'admin') {
        // Check authentication
        if (!adminAuth || !adminAuth.isAuthenticated()) {
            // Show login modal instead
            if (adminAuth) {
                adminAuth.showLoginModal();
            } else {
                alert('Admin authentication module not loaded. Please refresh the page.');
            }
            return; // Don't switch to admin view yet
        }
        // If authenticated, create logout button
        setTimeout(() => {
            if (adminAuth) {
                adminAuth.createLogoutButton();
            }
        }, 100);
    }

    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    // Show selected view
    const targetView = document.getElementById(`${viewName}View`);
    if (targetView) {
        targetView.classList.add('active');
        appState.currentView = viewName;
    }

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active');

    // Load view data
    if (viewName === 'history') {
        loadUserHistory();
    } else if (viewName === 'admin') {
        loadAdminDashboard();
    } else if (viewName === 'postman' || viewName === 'delivery') {
        if (window.loadAgentDashboards) {
            loadAgentDashboards();
        }
    }
}

// Navigation click handlers
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.dataset.view;
        switchView(view);
    });
});

// ====================================
// Theme Toggle
// ====================================

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    appState.theme = newTheme;

    // Update icon
    const icon = document.querySelector('.theme-icon');
    icon.textContent = newTheme === 'dark' ? '☀️' : '🌙';

    localStorage.setItem('theme', newTheme);
}

document.getElementById('themeToggle').addEventListener('click', toggleTheme);

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
appState.theme = savedTheme;
if (savedTheme === 'dark') {
    document.querySelector('.theme-icon').textContent = '☀️';
}

// ====================================
// API Helper Functions
// ====================================

async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.detail || 'API request failed');
        }

        return responseData;
    } catch (error) {
        console.error('API Error:', error);
        showNotification('Error: ' + error.message, 'error');
        throw error;
    }
}

// ====================================
// Notification System
// ====================================

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: var(--spacing-md) var(--spacing-lg);
        background: var(--glass-bg);
        backdrop-filter: blur(20px);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        z-index: 3000;
        max-width: 400px;
        animation: slideInRight var(--transition-base);
    `;

    notification.innerHTML = `
        <strong>${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</strong>
        <span style="margin-left: var(--spacing-sm);">${message}</span>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight var(--transition-base)';
        setTimeout(() => notification.remove(), 250);
    }, 5000);
}

// Add CSS for notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ====================================
// Utility Functions
// ====================================

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getVLColor(vl) {
    const colors = {
        'VL0': '#ef4444',
        'VL1': '#f59e0b',
        'VL2': '#3b82f6',
        'VL3': '#10b981'
    };
    return colors[vl] || '#6b7280';
}

function getVLLabel(vl) {
    const labels = {
        'VL0': 'Unverified',
        'VL1': 'Low Confidence',
        'VL2': 'Medium Confidence',
        'VL3': 'High Confidence'
    };
    return labels[vl] || 'Unknown';
}

// ====================================
// Initialize App
// ====================================

console.log('✅ DigiTrust-AVP App Initialized');
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('👤 Current User:', appState.currentUser);

// Simulate Agent Actions (Postman/Delivery)
function simulateAgentAction(role, id) {
    // Show processing
    showNotification('📡 Sending verification signal...', 'info');

    setTimeout(() => {
        // Store signal in localStorage for Admin to see (ID-specific)
        const signals = JSON.parse(localStorage.getItem('agent_signals') || '{}');

        if (!signals[id]) {
            signals[id] = {};
        }

        signals[id][role] = true;
        localStorage.setItem('agent_signals', JSON.stringify(signals));

        // Show success
        if (role === 'postman') {
            showNotification('✅ Address Verified! Signal sent to Admin.', 'success');
        } else {
            showNotification('📦 Package Delivered! Signal sent to Admin.', 'success');
        }

        // Update button UI
        const btn = event.target;
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = role === 'postman' ? '✅ Verified' : '✅ Delivered';
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-outline');
        }

    }, 1500);
}
