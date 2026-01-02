/**
 * Admin Authentication Component - Role Based Access
 * Roles: Admin, Postman, Delivery Agent
 */

class AdminAuth {
    constructor() {
        this.adminPassword = 'admin123'; // Demo password
        this.sessionKey = 'digitrust_admin_session';
        this.premiumMascot = null;
        this.init();
    }

    init() {
        // FOR DEMO: Commented out forced logout to allow authentication to persist
        // this.logout();
        return this.isAuthenticated();
    }

    isAuthenticated() {
        const session = localStorage.getItem(this.sessionKey);
        if (session) {
            const sessionData = JSON.parse(session);
            const now = new Date().getTime();
            // Check if session is still valid (24 hours)
            if (now - sessionData.timestamp < 24 * 60 * 60 * 1000) {
                return true;
            } else {
                this.logout();
                return false;
            }
        }
        return false;
    }

    login(password) {
        if (password === this.adminPassword) {
            const sessionData = {
                timestamp: new Date().getTime(),
                user: 'admin'
            };
            localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
            return true;
        }
        return false;
    }

    logout() {
        localStorage.removeItem(this.sessionKey);
    }

    // ==========================================
    // UI RENDERERS
    // ==========================================

    createModalBase() {
        const existingModal = document.getElementById('adminLoginPage');
        if (existingModal) existingModal.remove();

        // Check for Dark Mode (Persisted or System)
        const savedTheme = localStorage.getItem('theme') || document.documentElement.getAttribute('data-theme');
        const isDarkMode = savedTheme === 'dark' || document.body.classList.contains('dark-mode');
        const themeClass = isDarkMode ? 'dark-mode' : '';

        const modalHTML = `
            <div id="adminLoginPage" class="admin-login-page ${themeClass}">
                <div class="login-split-layout">
                    <!-- LEFT SIDE - Animated Background -->
                    <div class="login-left-side">
                        <!-- Floating Orbs -->
                        <div class="floating-orbs">
                            <div class="orb orb-1"></div>
                            <div class="orb orb-2"></div>
                            <div class="orb orb-3"></div>
                        </div>

                        <!-- Left Content with Mascots -->
                        <div class="login-left-content" id="loginLeftContent">
                            <!-- Mascots will be injected here -->
                        </div>
                    </div>

                    <!-- RIGHT SIDE - Content Area -->
                    <div class="login-right-side" id="loginRightContent">
                        <!-- Theme Toggle -->
                        <button class="theme-toggle-btn" onclick="window.adminAuthInstance.toggleLoginTheme()" title="Toggle Theme">
                            ${isDarkMode ? '☀️' : '🌙'}
                        </button>

                        <!-- Dynamic Content Goes Here -->
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Initialize Premium Mascot
        setTimeout(() => {
            const leftContent = document.getElementById('loginLeftContent');
            if (leftContent && window.PremiumMascot) {
                this.premiumMascot = new PremiumMascot();
                this.premiumMascot.attachToLeftSide(leftContent);
            }
            document.getElementById('adminLoginPage').classList.add('active');
        }, 50);
    }

    toggleLoginTheme() {
        const modal = document.getElementById('adminLoginPage');
        const btn = modal.querySelector('.theme-toggle-btn');
        const isDark = modal.classList.contains('dark-mode');

        if (isDark) {
            modal.classList.remove('dark-mode');
            btn.textContent = '🌙';
            localStorage.setItem('theme', 'light');
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            modal.classList.add('dark-mode');
            btn.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }

    // Entry Point
    showLoginModal() {
        this.createModalBase();
        this.renderRoleSelection();
    }

    renderRoleSelection() {
        const container = document.getElementById('loginRightContent');
        if (!container) return;

        // Preserve theme toggle
        const toggleBtn = container.querySelector('.theme-toggle-btn');
        const toggleHTML = toggleBtn ? toggleBtn.outerHTML : '';

        container.innerHTML = `
            ${toggleHTML}
            <div class="login-form-container" style="animation: slideInRight 0.4s ease;">
                <div class="login-form-header">
                    <h2>Select Your Role</h2>
                    <p>Choose your login type to proceed</p>
                </div>

                <div class="role-selection-grid">
                    <div class="role-card" onclick="window.adminAuthInstance.showAdminLogin()">
                        <div class="role-icon">👨‍💼</div>
                        <div class="role-title">Admin</div>
                    </div>
                    <div class="role-card" onclick="window.adminAuthInstance.showPostmanLogin()">
                        <div class="role-icon">📮</div>
                        <div class="role-title">Postman</div>
                    </div>
                    <div class="role-card" onclick="window.adminAuthInstance.showDeliveryLogin()">
                        <div class="role-icon">📦</div>
                        <div class="role-title">Delivery</div>
                    </div>
                </div>

                <button class="login-back-btn" onclick="window.adminAuthInstance.closeLoginModal()">
                    ← Back to Home
                </button>
            </div>
        `;
    }

    // 1. Admin Login
    showAdminLogin() {
        const container = document.getElementById('loginRightContent');
        if (!container) return;

        // Preserve theme toggle
        const toggleBtn = container.querySelector('.theme-toggle-btn');
        const toggleHTML = toggleBtn ? toggleBtn.outerHTML : '';

        container.innerHTML = `
            ${toggleHTML}
            <div class="login-form-container">
                <button class="login-back-btn" onclick="window.adminAuthInstance.renderRoleSelection()" style="top: 20px; left: 20px; position: absolute;">
                    ← Back
                </button>

                <div class="login-form-header">
                    <h2>Admin Login</h2>
                    <p>Access the main dashboard</p>
                </div>

                <div id="loginErrorMessage" class="login-error-message" style="display: none;"></div>

                <form id="adminLoginForm">
                    <div class="login-form-group">
                        <label class="login-form-label">Username</label>
                        <div class="login-form-input-wrapper">
                            <input type="text" id="adminUsernameInput" class="login-form-input" value="admin" required />
                        </div>
                    </div>

                    <div class="login-form-group">
                        <label class="login-form-label">Password</label>
                        <div class="login-form-input-wrapper">
                            <input type="password" id="adminPasswordInput" class="login-form-input" placeholder="Enter password" required />
                            <button type="button" class="login-toggle-password" onclick="window.adminAuthInstance.togglePasswordVisibility(this)">👁️</button>
                        </div>
                    </div>

                    <button type="submit" class="login-submit-btn" id="loginSubmitBtn">
                        <span id="btnText">Sign In</span>
                        <span id="btnLoader" style="display: none;" class="login-btn-loader"></span>
                    </button>
                </form>

                <div class="login-demo-hint">
                    Username: <strong>admin</strong> | Password: <strong>admin123</strong>
                </div>
            </div>
        `;

        this.setupAdminLoginListeners();
    }

    // 2. Postman Login
    showPostmanLogin() {
        const container = document.getElementById('loginRightContent');
        if (!container) return;

        // Preserve theme toggle
        const toggleBtn = container.querySelector('.theme-toggle-btn');
        const toggleHTML = toggleBtn ? toggleBtn.outerHTML : '';

        container.innerHTML = `
            ${toggleHTML}
            <div class="login-form-container">
                <button class="login-back-btn" id="backToRoleBtn" style="top: 20px; left: 20px; position: absolute;">
                    ← Back
                </button>

                <div class="login-form-header">
                    <h2>Postman Login</h2>
                    <p>Verify identity to access routes</p>
                </div>

                <form id="postmanLoginForm">
                    <div class="login-form-group">
                        <label class="login-form-label">Employee ID</label>
                        <input type="text" class="login-form-input" value="POSTMAN-01" placeholder="e.g. PM-8821" required />
                    </div>

                    <div class="login-form-group">
                        <label class="login-form-label">Password</label>
                        <div class="login-form-input-wrapper">
                            <input type="password" class="login-form-input" value="123456" placeholder="Enter password" required />
                            <button type="button" class="login-toggle-password">👁️</button>
                        </div>
                    </div>

                    <div class="login-form-group">
                        <label class="login-form-label">Identity Verification</label>
                        <button type="button" class="scan-btn">
                            <span>📷</span> Scan Barcode / QR
                        </button>
                        
                        <div class="file-upload-wrapper">
                            <label class="file-upload-label">
                                <span style="font-size: 2rem; margin-bottom: 0.5rem;">🆔</span>
                                <span>Upload ID Proof</span>
                                <span style="font-size: 0.8rem; color: #999; margin-top: 0.5rem;">Click to browse</span>
                                <input type="file" class="file-upload-input" accept="image/*" />
                            </label>
                        </div>
                    </div>

                    <button type="submit" class="login-submit-btn">
                        <span class="btn-text">Verify & Login</span>
                        <span class="login-btn-loader" style="display: none;"></span>
                    </button>
                </form>
                
                <div class="login-demo-hint">
                    Default ID: <strong>POSTMAN-01</strong> | Pass: <strong>123456</strong>
                </div>
            </div>
        `;

        this.setupRoleLoginListeners('postmanLoginForm', 'Postman');
    }

    // 3. Delivery Login
    showDeliveryLogin() {
        const container = document.getElementById('loginRightContent');
        if (!container) return;

        // Preserve theme toggle
        const toggleBtn = container.querySelector('.theme-toggle-btn');
        const toggleHTML = toggleBtn ? toggleBtn.outerHTML : '';

        container.innerHTML = `
            ${toggleHTML}
            <div class="login-form-container">
                <button class="login-back-btn" id="backToRoleBtn" style="top: 20px; left: 20px; position: absolute;">
                    ← Back
                </button>

                <div class="login-form-header">
                    <h2>Delivery Agent</h2>
                    <p>Scan credentials to start delivery</p>
                </div>

                <form id="deliveryLoginForm">
                    <div class="login-form-group">
                        <label class="login-form-label">Employee ID</label>
                        <input type="text" class="login-form-input" value="DELIVERY-01" placeholder="e.g. DA-5543" required />
                    </div>

                    <div class="login-form-group">
                        <label class="login-form-label">Password</label>
                        <div class="login-form-input-wrapper">
                            <input type="password" class="login-form-input" value="123456" placeholder="Enter password" required />
                            <button type="button" class="login-toggle-password">👁️</button>
                        </div>
                    </div>

                    <div class="login-form-group">
                        <label class="login-form-label">Quick Access</label>
                        <button type="button" class="scan-btn" style="background: #4a5568;">
                            <span>📱</span> Scan Agent QR Code
                        </button>
                    </div>

                    <div class="login-divider">OR</div>

                    <div class="login-form-group">
                        <label class="login-form-label">Upload ID Proof</label>
                         <div class="file-upload-wrapper">
                            <label class="file-upload-label">
                                <span style="font-size: 2rem; margin-bottom: 0.5rem;">📂</span>
                                <span>Select ID Document</span>
                                <input type="file" class="file-upload-input" accept="image/*" />
                            </label>
                        </div>
                    </div>

                    <button type="submit" class="login-submit-btn">
                        <span class="btn-text">Login</span>
                        <span class="login-btn-loader" style="display: none;"></span>
                    </button>
                </form>

                <div class="login-demo-hint">
                    Default ID: <strong>DELIVERY-01</strong> | Pass: <strong>123456</strong>
                </div>
            </div>
        `;

        this.setupRoleLoginListeners('deliveryLoginForm', 'Delivery Agent');
    }

    setupRoleLoginListeners(formId, role) {
        const form = document.getElementById(formId);
        const backBtn = document.getElementById('backToRoleBtn');

        if (backBtn) {
            backBtn.onclick = () => this.renderRoleSelection();
        }

        if (form) {
            // Password Toggle
            const toggleBtn = form.querySelector('.login-toggle-password');
            if (toggleBtn) {
                toggleBtn.onclick = () => this.togglePasswordVisibility(toggleBtn);
            }

            // Form Submit
            form.onsubmit = (e) => {
                e.preventDefault();
                console.log(`Submitting ${role} form...`);
                this.handleLogin(form, role);
            };
        } else {
            console.error(`Form ${formId} not found!`);
        }
    }

    togglePasswordVisibility(btn) {
        const inputWrapper = btn.parentElement;
        const input = inputWrapper.querySelector('input');
        if (input.type === 'password') {
            input.type = 'text';
            btn.textContent = '🙈'; // Hide icon
        } else {
            input.type = 'password';
            btn.textContent = '👁️'; // Show icon
        }
    }

    async handleLogin(form, role) {
        console.log('Attempting login for role:', role);

        // If form is passed (Postman/Delivery), get elements from it
        let passwordInput, errorDiv, submitBtn, btnText, btnLoader;

        if (form) {
            passwordInput = form.querySelector('input[type="password"]');
            submitBtn = form.querySelector('.login-submit-btn');
            btnText = submitBtn.querySelector('.btn-text');
            btnLoader = submitBtn.querySelector('.login-btn-loader');
            // Mock error div for now or create one
            errorDiv = document.createElement('div');
        } else {
            // Admin form (default)
            passwordInput = document.getElementById('adminPasswordInput');
            errorDiv = document.getElementById('loginErrorMessage');
            submitBtn = document.getElementById('loginSubmitBtn');
            btnText = document.getElementById('btnText');
            btnLoader = document.getElementById('btnLoader');
        }

        console.log('Form elements found:', { passwordInput, submitBtn });

        // Loading State
        if (btnText) btnText.style.display = 'none';
        if (btnLoader) btnLoader.style.display = 'inline-block';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
        }
        if (errorDiv) errorDiv.style.display = 'none';

        await new Promise(resolve => setTimeout(resolve, 800));

        // Simple validation for demo
        const password = passwordInput ? passwordInput.value : '';
        console.log('Password entered:', password);

        const isValid = password === 'admin123' || password === '123456';

        if (isValid) {
            console.log('Login successful');

            // Set admin session if it's admin login
            if (role === 'Admin' || !role || role === undefined) {
                this.login(password);
                console.log('Admin session created');
            }

            if (this.premiumMascot) this.premiumMascot.celebrateSuccess();

            setTimeout(() => {
                this.closeLoginModal();

                // Redirect based on role
                if (role === 'Postman') {
                    console.log('Switching to Postman view');
                    if (typeof switchView === 'function') {
                        switchView('postman');
                    } else {
                        console.error('switchView function not found!');
                        window.location.reload(); // Fallback
                    }
                } else if (role === 'Delivery Agent') {
                    console.log('Switching to Delivery view');
                    if (typeof switchView === 'function') {
                        switchView('delivery');
                    } else {
                        console.error('switchView function not found!');
                        window.location.reload(); // Fallback
                    }
                } else {
                    // Admin login
                    console.log('Switching to Admin view');
                    if (typeof switchView === 'function') {
                        switchView('admin');
                    } else {
                        const adminLink = document.querySelector('[data-view="admin"]');
                        if (adminLink) adminLink.click();
                    }
                }
            }, 1200);
        } else {
            console.log('Login failed');
            if (btnText) btnText.style.display = 'inline';
            if (btnLoader) btnLoader.style.display = 'none';
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
            }

            if (errorDiv && form) {
                // Shake button or show toast for non-admin forms
                submitBtn.classList.add('shake');
                setTimeout(() => submitBtn.classList.remove('shake'), 500);
                alert('❌ Invalid password');
            } else if (errorDiv) {
                errorDiv.textContent = '❌ Invalid password.';
                errorDiv.style.display = 'block';
            }

            if (this.premiumMascot) this.premiumMascot.shakeHeadNo();
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.focus();
            }
        }
    }

    // ==========================================
    // LOGIC & LISTENERS
    // ==========================================

    setupAdminLoginListeners() {
        const form = document.getElementById('adminLoginForm');
        const toggleBtn = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('adminPasswordInput');

        if (toggleBtn && passwordInput) {
            toggleBtn.addEventListener('click', () => {
                passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
            });
        }

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin(null, 'Admin'); // Call unified handleLogin with no form
            });
        }
    }

    closeLoginModal() {
        const modal = document.getElementById('adminLoginPage');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 400);
        }
    }

    createLogoutButton(viewName = 'admin') {
        const viewId = `${viewName}View`;
        const targetView = document.getElementById(viewId);

        if (targetView && !document.getElementById(`${viewName}LogoutBtn`)) {
            const logoutBtn = document.createElement('button');
            logoutBtn.id = `${viewName}LogoutBtn`;

            // Use btn-primary for gradient, remove admin-logout-btn (which forces absolute pos) for nav injections
            if (viewName !== 'admin') {
                logoutBtn.className = 'btn btn-primary';
            } else {
                logoutBtn.className = 'btn btn-outline admin-logout-btn';
            }

            logoutBtn.innerHTML = `
                <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Logout
            `;

            logoutBtn.onclick = () => {
                this.logout();
                if (window.switchView) {
                    window.switchView('submit'); // Go to main validation page
                } else {
                    window.location.reload();
                }
                showNotification('✓ Logged out successfully', 'success');
                // Remove button from navbar if it was placed there
                if (logoutBtn.parentNode) logoutBtn.remove();
            };

            // POSITIONING LOGIC
            if (viewName !== 'admin') {
                // For Postman/Delivery: Add to Navbar AFTER Theme Toggle
                const navbarContainer = document.querySelector('.navbar .container');
                const themeToggle = document.getElementById('themeToggle');

                if (navbarContainer && themeToggle) {
                    logoutBtn.style.marginLeft = '1rem';  // Spacing left of button (between moon and button)
                    logoutBtn.style.padding = '8px 16px';
                    logoutBtn.style.height = '40px';
                    logoutBtn.style.display = 'flex';
                    logoutBtn.style.alignItems = 'center';
                    logoutBtn.style.gap = '8px';

                    // Insert AFTER themeToggle
                    if (themeToggle.nextSibling) {
                        navbarContainer.insertBefore(logoutBtn, themeToggle.nextSibling);
                    } else {
                        navbarContainer.appendChild(logoutBtn);
                    }
                }
            } else {
                // For Admin: Keep inside the view container
                const container = targetView.querySelector('.container') || targetView;
                if (container) {
                    container.style.position = 'relative';
                    if (container.firstChild) {
                        container.insertBefore(logoutBtn, container.firstChild);
                    } else {
                        container.appendChild(logoutBtn);
                    }
                }
            }
        }
    }
}

// Export and attach to window for global access (needed for inline onclicks)
window.AdminAuth = AdminAuth;
