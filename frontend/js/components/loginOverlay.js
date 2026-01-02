// Integrated Login Overlay Controller

class LoginOverlay {
    constructor(authManager) {
        this.authManager = authManager;
        this.root = document.getElementById('login-overlay-root');
        this.container = document.getElementById('authContainer');
        this.closeBtn = document.getElementById('overlayCloseBtn');

        this.signUpBtn = document.getElementById('overlaySignUpBtn');
        this.signInBtn = document.getElementById('overlaySignInBtn');

        this.loginForm = document.getElementById('overlayLoginForm');
        this.signupForm = document.getElementById('overlaySignupForm');

        this.initEvents();
    }

    initEvents() {
        // Slide Animation
        this.signUpBtn.addEventListener('click', () => {
            this.container.classList.add("right-panel-active");
        });

        this.signInBtn.addEventListener('click', () => {
            this.container.classList.remove("right-panel-active");
        });

        // Close
        this.closeBtn.addEventListener('click', () => {
            this.hide();
        });

        // Login Submit
        this.loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });

        // Signup Submit (Optional for now, but wired)
        this.signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSignup();
        });
    }

    show() {
        this.root.classList.add('active');
        // Reset inputs?
    }

    hide() {
        this.root.classList.remove('active');
    }

    async handleLogin() {
        const email = document.getElementById('overlayLoginEmail').value;
        const password = document.getElementById('overlayLoginPassword').value;
        const btn = this.loginForm.querySelector('button');
        const originalText = btn.innerHTML;

        try {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
            btn.disabled = true;

            const response = await fetch(`${window.API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.detail || 'Login failed');

            // Success
            this.authManager.handleLoginSuccess(data);
            this.hide();

            // Reset button
            btn.innerHTML = originalText;
            btn.disabled = false;

        } catch (error) {
            alert(error.message); // Could use a toast inside overlay
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    async handleSignup() {
        const name = document.getElementById('overlaySignupName').value;
        const email = document.getElementById('overlaySignupEmail').value;
        const password = document.getElementById('overlaySignupPassword').value;

        const btn = this.signupForm.querySelector('button');
        const originalText = btn.innerHTML;

        try {
            btn.innerHTML = 'Creating...';
            btn.disabled = true;

            const response = await fetch(`${window.API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail);

            alert("Account created! Please Sign In.");
            this.container.classList.remove("right-panel-active"); // Switch to login

            // Pre-fill login
            document.getElementById('overlayLoginEmail').value = email;

            btn.innerHTML = originalText;
            btn.disabled = false;

        } catch (error) {
            alert(error.message);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}

// Explicitly export to window
window.LoginOverlay = LoginOverlay;
