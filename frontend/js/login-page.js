console.log("✅ Loaded login-page.js");

// Define API Base URL dynamically or fallback to production
const API_BASE_URL = window.API_BASE_URL || 'https://digitrust1.onrender.com';

const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const toast = document.getElementById('toast');

// --- Sliding Animation Logic ---
signUpButton.addEventListener('click', () => {
    container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
    container.classList.remove("right-panel-active");
});

// --- Toast Notification ---
function showToast(message, isError = false) {
    toast.textContent = message;
    toast.style.background = isError ? '#EF4444' : '#10B981';
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// --- Auth Logic ---

// 1. Sign In
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = loginForm.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
    btn.disabled = true;

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Login failed');
        }

        // Success
        showToast(`Welcome back, ${data.name}!`);
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('auth_user', JSON.stringify({ id: data.user_id, name: data.name }));

        // Redirect to main app (Home)
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);

    } catch (error) {
        showToast(error.message, true);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// 2. Sign Up
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = signupForm.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    btn.disabled = true;

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Signup failed');
        }

        // Success
        showToast('Account created! switching to login...', false);

        // Auto-switch to login
        setTimeout(() => {
            container.classList.remove("right-panel-active");
            document.getElementById('loginEmail').value = email;
            document.getElementById('loginPassword').value = '';

            // Reset button
            btn.innerHTML = originalText;
            btn.disabled = false;
            signupForm.reset();
        }, 1500);

    } catch (error) {
        showToast(error.message, true);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// --- Password Toggle Logic ---
function setupPasswordToggle(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);

    if (toggle && input) {
        toggle.addEventListener('click', () => {
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            toggle.classList.toggle('fa-eye');
            toggle.classList.toggle('fa-eye-slash');
        });
    }
}

setupPasswordToggle('loginPassword', 'toggleLoginPassword');
setupPasswordToggle('signupPassword', 'toggleSignupPassword');


// --- Forgot Password Logic ---
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', async (e) => {
        e.preventDefault();

        const loginEmailInput = document.getElementById('loginEmail');
        const email = loginEmailInput.value.trim();

        if (!email) {
            showToast('Please enter your email in the login box first!', true);
            loginEmailInput.focus();
            loginEmailInput.style.border = "2px solid #EF4444";
            setTimeout(() => loginEmailInput.style.border = "none", 2000);
            return;
        }

        const originalText = forgotPasswordLink.innerText;
        forgotPasswordLink.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                showToast(`Reset link sent to ${email} (Check your email)`, false);
            } else {
                showToast('Failed to send reset link', true);
            }
        } catch (error) {
            showToast('Network error', true);
        } finally {
            forgotPasswordLink.innerText = "Check your email!";
            setTimeout(() => {
                forgotPasswordLink.innerText = "Forgot Password?";
            }, 5000);
        }
    });
}

// --- SOCIAL LOGIN LOGIC (PORTED) ---

const GOOGLE_CLIENT_ID = '649391474644-pmpa1ug15ad87kafqa7utm27uiitk0om.apps.googleusercontent.com'; // From login2/app_login.js

let tokenClient;

function initGoogleLogin() {
    if (typeof google === 'undefined') return;

    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
                handleGoogleLogin(tokenResponse.access_token);
            }
        },
    });
}

const checkGoogleLoad = setInterval(() => {
    if (typeof google !== 'undefined') {
        initGoogleLogin();
        clearInterval(checkGoogleLoad);
    }
}, 500);

async function handleGoogleLogin(accessToken) {
    showToast('Verifying with Google...', false);

    try {
        const userInfoReq = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const googleUser = await userInfoReq.json();

        showToast(`Verifying identity for ${googleUser.name}...`, false);

        // SWAP TOKEN: Exchange Google Context for Internal JWT
        const swapResponse = await fetch(`${API_BASE_URL}/api/auth/login/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: accessToken,
                email: googleUser.email,
                name: googleUser.name,
                picture: googleUser.picture
            })
        });

        if (!swapResponse.ok) throw new Error("Token Swap Failed");
        const internalAuth = await swapResponse.json();

        showToast(`Welcome to DigiTrust, ${internalAuth.name}!`);

        // Save Internal Token
        localStorage.setItem('auth_token', internalAuth.access_token);
        localStorage.setItem('auth_user', JSON.stringify({
            id: internalAuth.user_id,
            name: internalAuth.name
        }));

        setTimeout(() => {
            window.location.href = '/';
        }, 1000);

    } catch (error) {
        console.error(error);
        showToast('Google Login Failed: ' + error.message, true);
    }
}

// --- Social Login Handler (GitHub & Discord) ---
async function startSocialLogin(provider) {
    console.log(`Starting login for ${provider}...`);
    showToast(`Contacting ${provider}...`, false);

    try {
        const backendUrl = `${API_BASE_URL}/api/auth/login/${provider.toLowerCase()}`;
        console.log(`Fetching: ${backendUrl}`);

        const response = await fetch(backendUrl);
        console.log(`Response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            alert(`Backend Error (${response.status}): ${errorText}`);
            throw new Error(`Backend replied ${response.status}`);
        }

        const data = await response.json();
        console.log("Backend data:", data);

        if (data.url) {
            window.location.href = data.url;
        } else {
            alert("Backend did not return a Redirect URL!");
        }
    } catch (e) {
        console.error(e);
        alert(`Login Error: ${e.message}`);
        showToast(`Failed to start ${provider} login`, true);
    }
}

// --- Click Handlers ---
// --- Click Handlers ---
document.querySelectorAll('.google-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();

        // Ensure Google Script is loaded
        if (typeof google === 'undefined' || !tokenClient) {
            showToast("Google API loading...", true);
            return;
        }

        if (GOOGLE_CLIENT_ID.includes('YOUR_')) {
            alert("Setup Google ID!");
        } else {
            tokenClient.requestAccessToken();
        }
    });
});

// --- Handle Social Redirect Back (Callback) ---
window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const socialToken = urlParams.get('social_token');
    if (socialToken) {
        // We are back from GitHub/Discord!
        const name = urlParams.get('user_name');
        const id = urlParams.get('user_id');
        const provider = urlParams.get('provider');
        const access_token = urlParams.get('token') || socialToken; // Support both

        showToast(`Logged in via ${provider}!`);

        localStorage.setItem('auth_token', access_token);
        localStorage.setItem('auth_user', JSON.stringify({ id, name }));

        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);

        // Redirect to Home
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    }
};
