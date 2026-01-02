class AuthManager {
    constructor() {
        // 0. Check for Token Handoff from Login 2 (URL Params)
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        const urlUser = urlParams.get('user');

        if (urlToken) {
            localStorage.setItem('auth_token', urlToken);
            if (urlUser) {
                localStorage.setItem('auth_user', decodeURIComponent(urlUser));
            }
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);

            // If query param requested a specific view, switch to it
            // (Note: AuthManager runs before app.js init often, but we can try)
            const urlView = urlParams.get('view');
            if (urlView) {
                // Must wait for DOM/App to be ready
                setTimeout(() => {
                    if (window.switchView) {
                        window.switchView(urlView);
                    }
                }, 100);
            }
        }

        this.token = localStorage.getItem('auth_token');
        this.user = JSON.parse(localStorage.getItem('auth_user') || 'null');
        this.initUI();
    }

    isAuthenticated() {
        return !!this.token;
    }

    getToken() {
        return this.token;
    }

    initUI() {
        // 1. Restore User Menu
        if (!document.getElementById('userMenuContainer')) {
            const themeBtn = document.getElementById('themeToggle');
            const menuContainer = document.createElement('div');
            menuContainer.id = 'userMenuContainer';
            menuContainer.className = 'user-menu';
            if (themeBtn && themeBtn.parentNode) {
                themeBtn.parentNode.insertBefore(menuContainer, themeBtn);
            }
        }

        // Initialize Overlay Component
        if (!this.overlay && window.LoginOverlay) {
            this.overlay = new LoginOverlay(this);
        }

        this.updateUI();
    }

    showLoginModal() {
        // Use Integrated Overlay
        if (this.overlay) {
            this.overlay.show();
        } else {
            console.warn("LoginOverlay not loaded, fallback to redirect");
            window.location.href = '/';
        }
    }

    handleLoginSuccess(data) {
        this.token = data.access_token;
        this.user = { id: data.user_id, name: data.name };

        localStorage.setItem('auth_token', this.token);
        localStorage.setItem('auth_user', JSON.stringify(this.user));

        this.updateUI();

        // Hydrate App State immediately
        if (window.appState) {
            window.appState.currentUser = this.user.id;
        }

        // Update form inputs if present
        const userIdInput = document.getElementById('userId');
        if (userIdInput) {
            userIdInput.value = this.user.id;
            userIdInput.setAttribute('disabled', 'true'); // Lock it!
            userIdInput.title = "Linked to your login account";
        }

        // Check if we need to switch view (e.g. if we were blocked)
        // Usually safe to reload history if that's where we were
        const currentView = window.appState ? window.appState.currentView : 'submit';
        if (currentView === 'history' && window.loadUserHistory) {
            window.loadUserHistory();
        }
    }

    updateUI() {
        // Update User Menu based on auth state
        const menuContainer = document.getElementById('userMenuContainer');
        if (!menuContainer) return;

        if (this.isAuthenticated()) {
            menuContainer.innerHTML = `
                <div class="user-badge" onclick="authManager.logout()">
                    <span>👤 ${this.user.name}</span>
                    <small>LOGOUT</small>
                </div>
            `;
        } else {
            menuContainer.innerHTML = `
                <button class="btn btn-primary btn-sm" onclick="authManager.showLoginModal()">
                    Login
                </button>
            `;
        }
    }

    hideLoginModal() {
        // This method is no longer directly used for hiding an internal modal,
        // but might be called by other parts of the app.
        // Since we redirect, there's no modal to hide.
        console.warn("hideLoginModal called, but login is now a redirect. No modal to hide.");
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const btn = document.getElementById('mechSubmit');
        const gears = document.getElementById('mainGears');

        // Mechanical Animation
        btn.querySelector('.pull-label').innerHTML = '[ ACTUATING... ]';
        btn.disabled = true;
        gears.style.transition = 'transform 2s cubic-bezier(0.4, 0, 0.2, 1)';
        gears.style.transform += 'rotate(360deg)';

        await new Promise(r => setTimeout(r, 1500));

        try {
            const baseUrl = this.getApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Mechanism Stuck (Login Failed)');
            }

            const data = await response.json();
            this.handleLoginSuccess(data);

            if (window.showNotification) window.showNotification(`System Validated. Welcome, ${this.user.name}!`, 'success');

            // Close overlay if using one
            if (this.overlay) this.overlay.hide();

        } catch (error) {
            console.error(error);
            if (window.showNotification) window.showNotification(error.message, 'error');
            else alert(error.message);
        } finally {
            if (btn) {
                btn.querySelector('.pull-label').innerHTML = '[ PULL TO LOGIN ]';
                btn.disabled = false;
            }
        }
    }

    getApiBaseUrl() {
        return window.API_BASE_URL || 'https://digitrust1.onrender.com';
    }

    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        this.token = null;
        this.user = null;
        this.updateUI();
        if (window.showNotification) window.showNotification('Logged out.', 'info');
        if (appState.currentView === 'history' && window.switchView) window.switchView('submit');
    }
}

}

// Initialize when DOM is ready to ensure LoginOverlay is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});
