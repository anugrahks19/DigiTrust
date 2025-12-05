/**
 * 4 Interactive Creature Mascots
 * Design: Blob/Monster creatures (NOT human)
 * Colors: Violet, Black, Yellow, Orange
 */

class FourMascots {
    constructor() {
        this.mascots = [];
        this.colors = {
            violet: { body: '#9B59B6', belly: '#AF7AC5', dark: '#8E44AD' },
            black: { body: '#34495E', belly: '#5D6D7E', dark: '#2C3E50' },
            yellow: { body: '#F1C40F', belly: '#F7DC6F', dark: '#D4AC0D' },
            orange: { body: '#E67E22', belly: '#F0B27A', dark: '#D35400' }
        };
        this.isPasswordVisible = false;
    }

    createMascot(colorKey, colorScheme) {
        const { body, belly, dark } = colorScheme;

        return `
            <div class="interactive-mascot mascot-${colorKey}">
                <svg viewBox="0 0 200 200" class="mascot-character-svg">
                    <!-- Creature Body -->
                    <g class="mascot-body-${colorKey}">
                        <!-- Main Body Shape (Gumdrop/Blob) -->
                        <path d="M 50 180 L 150 180 Q 170 180 170 150 L 170 90 Q 170 30 100 30 Q 30 30 30 90 L 30 150 Q 30 180 50 180 Z" 
                              fill="${body}" stroke="#333" stroke-width="2"/>
                        
                        <!-- Belly Patch -->
                        <ellipse cx="100" cy="130" rx="40" ry="35" fill="${belly}" opacity="0.8"/>
                        
                        <!-- Ears -->
                        <circle cx="40" cy="40" r="15" fill="${body}" stroke="#333" stroke-width="2"/>
                        <circle cx="40" cy="40" r="8" fill="${dark}" opacity="0.6"/>
                        
                        <circle cx="160" cy="40" r="15" fill="${body}" stroke="#333" stroke-width="2"/>
                        <circle cx="160" cy="40" r="8" fill="${dark}" opacity="0.6"/>
                    </g>

                    <!-- Face Group (Moves slightly for 3D effect) -->
                    <g class="mascot-head-${colorKey}">
                        <!-- Left Eye -->
                        <g class="mascot-eye-group">
                            <circle cx="75" cy="85" r="18" fill="white" stroke="#333" stroke-width="2"/>
                            <g class="mascot-pupil-left-${colorKey}">
                                <circle cx="75" cy="85" r="8" fill="#333"/>
                                <circle cx="78" cy="82" r="3" fill="white"/>
                            </g>
                        </g>
                        
                        <!-- Right Eye -->
                        <g class="mascot-eye-group">
                            <circle cx="125" cy="85" r="18" fill="white" stroke="#333" stroke-width="2"/>
                            <g class="mascot-pupil-right-${colorKey}">
                                <circle cx="125" cy="85" r="8" fill="#333"/>
                                <circle cx="128" cy="82" r="3" fill="white"/>
                            </g>
                        </g>

                        <!-- Mouth -->
                        <path class="mascot-mouth-${colorKey}" d="M 85 120 Q 100 130 115 120" 
                              stroke="#333" stroke-width="3" fill="none" stroke-linecap="round"/>
                              
                        <!-- Snout/Nose (Cute animal nose) -->
                        <ellipse cx="100" cy="105" rx="8" ry="5" fill="#333"/>
                    </g>
                    
                    <!-- Hands (Paws that come up) -->
                    <g class="mascot-hands-${colorKey}" style="opacity: 0; transform: translateY(20px);">
                        <!-- Left Paw -->
                        <ellipse cx="65" cy="90" rx="22" ry="25" fill="${body}" stroke="#333" stroke-width="2" transform="rotate(-15 65 90)"/>
                        <circle cx="65" cy="80" r="6" fill="${dark}" opacity="0.5"/>
                        <circle cx="55" cy="85" r="4" fill="${dark}" opacity="0.5"/>
                        <circle cx="75" cy="85" r="4" fill="${dark}" opacity="0.5"/>
                        
                        <!-- Right Paw -->
                        <ellipse cx="135" cy="90" rx="22" ry="25" fill="${body}" stroke="#333" stroke-width="2" transform="rotate(15 135 90)"/>
                        <circle cx="135" cy="80" r="6" fill="${dark}" opacity="0.5"/>
                        <circle cx="125" cy="85" r="4" fill="${dark}" opacity="0.5"/>
                        <circle cx="145" cy="85" r="4" fill="${dark}" opacity="0.5"/>
                    </g>
                </svg>
            </div>
        `;
    }

    createAllMascots() {
        const mascotHTML = `
            <div class="four-mascots-grid">
                ${this.createMascot('violet', this.colors.violet)}
                ${this.createMascot('black', this.colors.black)}
                ${this.createMascot('yellow', this.colors.yellow)}
                ${this.createMascot('orange', this.colors.orange)}
            </div>
        `;
        return mascotHTML;
    }

    attachToLeftSide(leftContent) {
        if (!leftContent) return;

        leftContent.innerHTML = this.createAllMascots();

        // Store references
        ['violet', 'black', 'yellow', 'orange'].forEach(color => {
            this.mascots.push({
                color: color,
                leftPupil: document.querySelector(`.mascot-pupil-left-${color}`),
                rightPupil: document.querySelector(`.mascot-pupil-right-${color}`),
                head: document.querySelector(`.mascot-head-${color}`),
                hands: document.querySelector(`.mascot-hands-${color}`),
                mouth: document.querySelector(`.mascot-mouth-${color}`)
            });
        });

        this.setupEventListeners();
    }

    setupEventListeners() {
        setTimeout(() => {
            const modal = document.getElementById('adminLoginPage');
            if (!modal) return;

            modal.addEventListener('mousemove', (e) => this.followCursor(e));

            const passwordInput = document.getElementById('adminPasswordInput');
            const toggleBtn = document.getElementById('togglePassword');

            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    setTimeout(() => {
                        const type = passwordInput.type;
                        if (type === 'text') {
                            this.coverEyes();
                        } else {
                            this.uncoverEyes();
                        }
                    }, 50);
                });
            }
        }, 500);
    }

    followCursor(e) {
        if (this.isPasswordVisible) return;

        const firstMascot = document.querySelector('.interactive-mascot');
        if (!firstMascot) return;

        const rect = firstMascot.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const angleX = (e.clientX - centerX) / rect.width;
        const angleY = (e.clientY - centerY) / rect.height;

        const maxMove = 10; // Bigger eye movement for creatures
        const moveX = Math.max(-maxMove, Math.min(maxMove, angleX * 20));
        const moveY = Math.max(-maxMove, Math.min(maxMove, angleY * 20));

        this.mascots.forEach(mascot => {
            if (mascot.leftPupil && mascot.rightPupil) {
                mascot.leftPupil.style.transform = `translate(${moveX}px, ${moveY}px)`;
                mascot.rightPupil.style.transform = `translate(${moveX}px, ${moveY}px)`;
            }
            // Slight head movement
            if (mascot.head) {
                mascot.head.style.transform = `translate(${moveX / 3}px, ${moveY / 3}px)`;
            }
        });
    }

    coverEyes() {
        this.isPasswordVisible = true;
        this.mascots.forEach(mascot => {
            if (mascot.hands) {
                mascot.hands.style.opacity = '1';
                mascot.hands.style.transform = 'translateY(0)'; // Move hands up
            }
        });
    }

    uncoverEyes() {
        this.isPasswordVisible = false;
        this.mascots.forEach(mascot => {
            if (mascot.hands) {
                mascot.hands.style.opacity = '0';
                mascot.hands.style.transform = 'translateY(20px)'; // Move hands down
            }
        });
    }

    shakeHeadNo() {
        this.mascots.forEach(mascot => {
            if (!mascot.head) return;

            const shakeKeyframes = [
                { transform: 'translateX(0)' },
                { transform: 'translateX(-10px)' },
                { transform: 'translateX(10px)' },
                { transform: 'translateX(-10px)' },
                { transform: 'translateX(10px)' },
                { transform: 'translateX(0)' }
            ];

            mascot.head.animate(shakeKeyframes, { duration: 400 });

            if (mascot.mouth) {
                mascot.mouth.setAttribute('d', 'M 85 125 Q 100 120 115 125'); // Sad
                setTimeout(() => {
                    mascot.mouth.setAttribute('d', 'M 85 120 Q 100 130 115 120'); // Normal
                }, 1500);
            }
        });
    }

    nodHeadYes() {
        this.mascots.forEach(mascot => {
            if (!mascot.head) return;

            const nodKeyframes = [
                { transform: 'translateY(0)' },
                { transform: 'translateY(10px)' },
                { transform: 'translateY(-5px)' },
                { transform: 'translateY(10px)' },
                { transform: 'translateY(0)' }
            ];

            mascot.head.animate(nodKeyframes, { duration: 500 });

            if (mascot.mouth) {
                mascot.mouth.setAttribute('d', 'M 80 115 Q 100 135 120 115'); // Big Smile
            }
        });
    }

    celebrateSuccess() {
        this.mascots.forEach((mascot, index) => {
            const el = document.querySelector(`.mascot-${mascot.color}`);
            if (!el) return;

            setTimeout(() => {
                el.animate([
                    { transform: 'translateY(0)' },
                    { transform: 'translateY(-30px)' },
                    { transform: 'translateY(0)' }
                ], { duration: 600, easing: 'ease-out' });
            }, index * 100);
        });
    }
}

window.FourMascots = FourMascots;
