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
