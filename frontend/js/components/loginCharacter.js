/**
 * Interactive Login Creature (Right Side)
 * Design: Cute Yeti/Monster (NOT human)
 * Follows cursor, covers eyes, reacts to input
 */

class LoginCharacter {
    constructor() {
        this.character = null;
        this.leftPupil = null;
        this.rightPupil = null;
        this.head = null;
        this.hands = null;
        this.mouth = null;
        this.isPasswordVisible = false;
        this.init();
    }

    init() {
        // Character is created when attached to modal
    }

    createCharacter() {
        // Blue Yeti Design
        const bodyColor = '#5DADE2';
        const bellyColor = '#85C1E9';
        const darkColor = '#2874A6';

        return `
            <div class="login-character" id="loginCharacter">
                <svg viewBox="0 0 200 200" class="character-svg">
                    <!-- Creature Body -->
                    <g id="characterBody">
                        <!-- Main Body Shape -->
                        <path d="M 50 180 L 150 180 Q 170 180 170 150 L 170 90 Q 170 30 100 30 Q 30 30 30 90 L 30 150 Q 30 180 50 180 Z" 
                              fill="${bodyColor}" stroke="#333" stroke-width="2"/>
                        
                        <!-- Belly Patch -->
                        <ellipse cx="100" cy="130" rx="40" ry="35" fill="${bellyColor}" opacity="0.8"/>
                        
                        <!-- Ears -->
                        <circle cx="40" cy="40" r="15" fill="${bodyColor}" stroke="#333" stroke-width="2"/>
                        <circle cx="40" cy="40" r="8" fill="${darkColor}" opacity="0.6"/>
                        
                        <circle cx="160" cy="40" r="15" fill="${bodyColor}" stroke="#333" stroke-width="2"/>
                        <circle cx="160" cy="40" r="8" fill="${darkColor}" opacity="0.6"/>
                    </g>

                    <!-- Face Group -->
                    <g id="characterHead">
                        <!-- Left Eye -->
                        <g class="eye-group">
                            <circle cx="75" cy="85" r="18" fill="white" stroke="#333" stroke-width="2"/>
                            <g id="leftPupil">
                                <circle cx="75" cy="85" r="8" fill="#333"/>
                                <circle cx="78" cy="82" r="3" fill="white"/>
                            </g>
                        </g>
                        
                        <!-- Right Eye -->
                        <g class="eye-group">
                            <circle cx="125" cy="85" r="18" fill="white" stroke="#333" stroke-width="2"/>
                            <g id="rightPupil">
                                <circle cx="125" cy="85" r="8" fill="#333"/>
                                <circle cx="128" cy="82" r="3" fill="white"/>
                            </g>
                        </g>

                        <!-- Mouth -->
                        <path id="characterMouth" d="M 85 120 Q 100 130 115 120" 
                              stroke="#333" stroke-width="3" fill="none" stroke-linecap="round"/>
                              
                        <!-- Snout/Nose -->
                        <ellipse cx="100" cy="105" rx="8" ry="5" fill="#333"/>
                    </g>
                    
                    <!-- Hands (Paws) -->
                    <g id="characterHands" style="opacity: 0; transform: translateY(20px);">
                        <!-- Left Paw -->
                        <ellipse cx="65" cy="90" rx="22" ry="25" fill="${bodyColor}" stroke="#333" stroke-width="2" transform="rotate(-15 65 90)"/>
                        <circle cx="65" cy="80" r="6" fill="${darkColor}" opacity="0.5"/>
                        <circle cx="55" cy="85" r="4" fill="${darkColor}" opacity="0.5"/>
                        <circle cx="75" cy="85" r="4" fill="${darkColor}" opacity="0.5"/>
                        
                        <!-- Right Paw -->
                        <ellipse cx="135" cy="90" rx="22" ry="25" fill="${bodyColor}" stroke="#333" stroke-width="2" transform="rotate(15 135 90)"/>
                        <circle cx="135" cy="80" r="6" fill="${darkColor}" opacity="0.5"/>
                        <circle cx="125" cy="85" r="4" fill="${darkColor}" opacity="0.5"/>
                        <circle cx="145" cy="85" r="4" fill="${darkColor}" opacity="0.5"/>
                    </g>
                </svg>
            </div>
        `;
    }

    attachToModal(modalElement) {
        const formContainer = modalElement.querySelector('.login-form-container');
        if (formContainer) {
            formContainer.insertAdjacentHTML('afterbegin', this.createCharacter());

            this.character = document.getElementById('loginCharacter');
            this.leftPupil = document.getElementById('leftPupil');
            this.rightPupil = document.getElementById('rightPupil');
            this.head = document.getElementById('characterHead');
            this.hands = document.getElementById('characterHands');
            this.mouth = document.getElementById('characterMouth');

            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        const modal = document.getElementById('adminLoginPage');
        if (!modal) return;

        modal.addEventListener('mousemove', (e) => this.followCursor(e));

        const passwordInput = document.getElementById('adminPasswordInput');
        const toggleBtn = document.getElementById('togglePassword');
        const usernameInput = document.getElementById('adminUsernameInput');

        if (passwordInput) {
            passwordInput.addEventListener('focus', () => this.lookAtField(10));
            passwordInput.addEventListener('blur', () => this.resetLook());
        }

        if (usernameInput) {
            usernameInput.addEventListener('focus', () => this.lookAtField(5));
            usernameInput.addEventListener('blur', () => this.resetLook());
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                setTimeout(() => {
                    if (passwordInput.type === 'text') {
                        this.coverEyes();
                    } else {
                        this.uncoverEyes();
                    }
                }, 50);
            });
        }
    }

    followCursor(e) {
        if (this.isPasswordVisible || !this.leftPupil) return;

        const rect = this.character.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const angleX = (e.clientX - centerX) / rect.width;
        const angleY = (e.clientY - centerY) / rect.height;

        const maxMove = 10;
        const moveX = Math.max(-maxMove, Math.min(maxMove, angleX * 20));
        const moveY = Math.max(-maxMove, Math.min(maxMove, angleY * 20));

        this.leftPupil.style.transform = `translate(${moveX}px, ${moveY}px)`;
        this.rightPupil.style.transform = `translate(${moveX}px, ${moveY}px)`;

        if (this.head) {
            this.head.style.transform = `translate(${moveX / 3}px, ${moveY / 3}px)`;
        }
    }

    lookAtField(offsetY) {
        if (this.isPasswordVisible) return;
        this.leftPupil.style.transform = `translate(0px, ${offsetY}px)`;
        this.rightPupil.style.transform = `translate(0px, ${offsetY}px)`;
    }

    resetLook() {
        if (this.isPasswordVisible) return;
        this.leftPupil.style.transform = 'translate(0, 0)';
        this.rightPupil.style.transform = 'translate(0, 0)';
    }

    coverEyes() {
        this.isPasswordVisible = true;
        if (this.hands) {
            this.hands.style.opacity = '1';
            this.hands.style.transform = 'translateY(0)';
            this.hands.style.transition = 'all 0.3s ease';
        }
    }

    uncoverEyes() {
        this.isPasswordVisible = false;
        if (this.hands) {
            this.hands.style.opacity = '0';
            this.hands.style.transform = 'translateY(20px)';
        }
    }

    shakeHeadNo() {
        if (!this.head) return;

        const shakeKeyframes = [
            { transform: 'translateX(0)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(0)' }
        ];

        this.head.animate(shakeKeyframes, { duration: 400 });

        if (this.mouth) {
            this.mouth.setAttribute('d', 'M 85 125 Q 100 120 115 125'); // Sad
            setTimeout(() => {
                this.mouth.setAttribute('d', 'M 85 120 Q 100 130 115 120'); // Normal
            }, 1500);
        }
    }

    nodHeadYes() {
        if (!this.head) return;

        const nodKeyframes = [
            { transform: 'translateY(0)' },
            { transform: 'translateY(10px)' },
            { transform: 'translateY(-5px)' },
            { transform: 'translateY(10px)' },
            { transform: 'translateY(0)' }
        ];

        this.head.animate(nodKeyframes, { duration: 500 });

        if (this.mouth) {
            this.mouth.setAttribute('d', 'M 80 115 Q 100 135 120 115'); // Big Smile
        }
    }

    celebrateSuccess() {
        if (!this.character) return;

        this.character.animate([
            { transform: 'translateY(0)' },
            { transform: 'translateY(-30px)' },
            { transform: 'translateY(0)' }
        ], { duration: 600, easing: 'ease-out' });
    }
}

window.LoginCharacter = LoginCharacter;
