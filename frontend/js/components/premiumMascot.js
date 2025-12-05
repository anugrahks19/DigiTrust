/**
 * Premium 3D Mascot (Left Side Only)
 * Design: High-Fidelity Glossy 3D Character (Pixar-style)
 * Features: Advanced gradients, rim lighting, smooth animations
 */

class PremiumMascot {
    constructor() {
        this.isPasswordVisible = false;
        this.faceGroup = null;
        this.pupils = [];
        this.hands = null;
        this.body = null;
        this.mouth = null;
    }

    createMascot() {
        return `
            <div class="premium-mascot-container" style="position: relative; overflow: visible; background: transparent !important; border: none !important;">
                <!-- Floating Background Orbs -->
                <div class="mascot-bg-orb orb-1"></div>
                <div class="mascot-bg-orb orb-2"></div>
                <div class="mascot-bg-orb orb-3"></div>

                <svg viewBox="0 0 400 400" class="premium-mascot-svg" style="position: relative; z-index: 1; background: transparent;">
                    <defs>
                        <!-- 3D Body Gradient (Purple/Blue/Pink) -->
                        <radialGradient id="body-gradient" cx="30%" cy="30%" r="80%" fx="30%" fy="30%">
                            <stop offset="0%" style="stop-color:#a8c0ff;stop-opacity:1" />
                            <stop offset="40%" style="stop-color:#3f2b96;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#2c1e68;stop-opacity:1" />
                        </radialGradient>

                        <!-- Rim Light (for 3D edge effect) -->
                        <filter id="rim-light" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
                            <feOffset in="blur" dx="-2" dy="-2" result="offsetBlur"/>
                            <feSpecularLighting in="blur" surfaceScale="5" specularConstant="1" specularExponent="20" lighting-color="#ffffff" result="specOut">
                                <fePointLight x="-5000" y="-10000" z="20000"/>
                            </feSpecularLighting>
                            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
                            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
                        </filter>

                        <!-- Eye Gradient -->
                        <radialGradient id="eye-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                            <stop offset="80%" style="stop-color:#ffffff;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#e0e0e0;stop-opacity:1" />
                        </radialGradient>

                        <!-- Pupil Gradient -->
                        <radialGradient id="pupil-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                            <stop offset="0%" style="stop-color:#222;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#000;stop-opacity:1" />
                        </radialGradient>

                        <!-- Glossy Shine -->
                        <linearGradient id="shine-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.8" />
                            <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0" />
                        </linearGradient>

                        <!-- Drop Shadow -->
                        <filter id="drop-shadow">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="10"/>
                            <feOffset dx="0" dy="10" result="offsetblur"/>
                            <feComponentTransfer>
                                <feFuncA type="linear" slope="0.3"/>
                            </feComponentTransfer>
                            <feMerge> 
                                <feMergeNode/>
                                <feMergeNode in="SourceGraphic"/> 
                            </feMerge>
                        </filter>
                    </defs>

                    <!-- Shadow -->
                    <ellipse cx="200" cy="340" rx="80" ry="15" fill="#000" opacity="0.2" filter="url(#drop-shadow)"/>

                    <!-- Main Body -->
                    <g class="mascot-body-group">
                        <!-- Body Shape -->
                        <path d="M 100 300 Q 50 300 50 200 Q 50 80 200 80 Q 350 80 350 200 Q 350 300 300 300 Z" 
                              fill="url(#body-gradient)" filter="url(#rim-light)"/>
                        
                        <!-- Glossy Highlight (Top) -->
                        <ellipse cx="150" cy="130" rx="60" ry="30" fill="url(#shine-gradient)" transform="rotate(-20 150 130)"/>
                        
                        <!-- Ears (Cute rounded) -->
                        <path d="M 60 120 Q 30 80 80 60" fill="url(#body-gradient)" stroke="none" style="z-index:-1"/>
                        <path d="M 340 120 Q 370 80 320 60" fill="url(#body-gradient)" stroke="none" style="z-index:-1"/>
                    </g>

                    <!-- Face Container (Moves for 3D effect) -->
                    <g class="mascot-face-group">
                        <!-- Left Eye -->
                        <g class="eye-left">
                            <circle cx="140" cy="180" r="35" fill="url(#eye-gradient)" stroke="#ddd" stroke-width="1"/>
                            <g class="pupil-left">
                                <circle cx="140" cy="180" r="18" fill="url(#pupil-gradient)"/>
                                <circle cx="148" cy="172" r="6" fill="#fff" opacity="0.9"/>
                                <circle cx="135" cy="185" r="3" fill="#fff" opacity="0.4"/>
                            </g>
                        </g>

                        <!-- Right Eye -->
                        <g class="eye-right">
                            <circle cx="260" cy="180" r="35" fill="url(#eye-gradient)" stroke="#ddd" stroke-width="1"/>
                            <g class="pupil-right">
                                <circle cx="260" cy="180" r="18" fill="url(#pupil-gradient)"/>
                                <circle cx="268" cy="172" r="6" fill="#fff" opacity="0.9"/>
                                <circle cx="255" cy="185" r="3" fill="#fff" opacity="0.4"/>
                            </g>
                        </g>

                        <!-- Mouth -->
                        <path class="mascot-mouth" d="M 180 230 Q 200 245 220 230" 
                              fill="none" stroke="#2c1e68" stroke-width="4" stroke-linecap="round"/>
                        
                        <!-- Cheeks -->
                        <ellipse cx="120" cy="210" rx="15" ry="8" fill="#ff99cc" opacity="0.4"/>
                        <ellipse cx="280" cy="210" rx="15" ry="8" fill="#ff99cc" opacity="0.4"/>
                    </g>

                    <!-- Hands (Cute Paws - Centered on Eyes) -->
                    <g class="mascot-hands" style="opacity: 0; transform: translateY(50px);">
                        <!-- Left Hand (Center cx=140 to match Left Eye) -->
                        <g class="hand-left">
                            <circle cx="140" cy="260" r="45" fill="url(#body-gradient)" stroke="#2c1e68" stroke-width="1"/>
                            <ellipse cx="120" cy="230" rx="12" ry="15" fill="url(#body-gradient)" stroke="#2c1e68" stroke-width="1"/>
                            <ellipse cx="140" cy="220" rx="12" ry="18" fill="url(#body-gradient)" stroke="#2c1e68" stroke-width="1"/>
                            <ellipse cx="160" cy="230" rx="12" ry="15" fill="url(#body-gradient)" stroke="#2c1e68" stroke-width="1"/>
                            <circle cx="140" cy="260" r="28" fill="#ff99cc" opacity="0.3"/> <!-- Paw Pad -->
                        </g>
                        
                        <!-- Right Hand (Center cx=260 to match Right Eye) -->
                        <g class="hand-right">
                            <circle cx="260" cy="260" r="45" fill="url(#body-gradient)" stroke="#2c1e68" stroke-width="1"/>
                            <ellipse cx="240" cy="230" rx="12" ry="15" fill="url(#body-gradient)" stroke="#2c1e68" stroke-width="1"/>
                            <ellipse cx="260" cy="220" rx="12" ry="18" fill="url(#body-gradient)" stroke="#2c1e68" stroke-width="1"/>
                            <ellipse cx="280" cy="230" rx="12" ry="15" fill="url(#body-gradient)" stroke="#2c1e68" stroke-width="1"/>
                            <circle cx="260" cy="260" r="28" fill="#ff99cc" opacity="0.3"/> <!-- Paw Pad -->
                        </g>
                    </g>
                </svg>
            </div>
        `;
    }

    attachToLeftSide(leftContent) {
        if (!leftContent) return;
        leftContent.innerHTML = this.createMascot();

        // Get References
        this.faceGroup = document.querySelector('.mascot-face-group');
        this.pupils = [
            document.querySelector('.pupil-left'),
            document.querySelector('.pupil-right')
        ];
        this.hands = document.querySelector('.mascot-hands');
        this.mouth = document.querySelector('.mascot-mouth');
        this.body = document.querySelector('.mascot-body-group');

        this.addSmoothness();
        this.setupEventListeners();
    }

    setupEventListeners() {
        setTimeout(() => {
            const modal = document.getElementById('adminLoginPage');
            if (!modal) return;

            // Follow Cursor
            modal.addEventListener('mousemove', (e) => this.followCursor(e));

            // Event Delegation for Password Toggle Buttons ONLY
            modal.addEventListener('click', (e) => {
                const toggleBtn = e.target.closest('.login-toggle-password');
                if (toggleBtn) {
                    const inputWrapper = toggleBtn.parentElement;
                    const passwordInput = inputWrapper.querySelector('input');

                    if (passwordInput) {
                        // React to the toggle state
                        setTimeout(() => {
                            if (passwordInput.type === 'text') {
                                // Password Visible -> Show Hands (Cover Eyes / Shy)
                                this.coverEyes();
                            } else {
                                // Password Hidden -> Hide Hands
                                this.uncoverEyes();
                            }
                        }, 50);
                    }
                }
            });

            // Start Blinking Loop
            this.startBlinking();

        }, 500);
    }

    // Add smooth transition to pupils (initially)
    addSmoothness() {
        this.pupils.forEach(pupil => {
            if (pupil) pupil.style.transition = 'transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        });
    }

    startBlinking() {
        const blinkInterval = () => {
            if (!this.isPasswordVisible) { // Don't blink if eyes are covered
                this.blink();
            }
            // Random interval between 3s and 6s
            const nextBlink = Math.random() * 3000 + 3000;
            this.blinkTimer = setTimeout(blinkInterval, nextBlink);
        };
        blinkInterval();
    }

    blink() {
        const eyes = [
            document.querySelector('.eye-left circle:first-child'), // Sclera
            document.querySelector('.eye-right circle:first-child'),
            document.querySelector('.pupil-left'),
            document.querySelector('.pupil-right')
        ];

        // Close eyes (scaleY 0.1)
        eyes.forEach(el => {
            if (el) {
                el.style.transition = 'transform 0.1s ease-in-out';
                el.style.transformOrigin = 'center';
                // Save current transform for pupils to restore it correctly
                if (el.classList.contains('pupil-left') || el.classList.contains('pupil-right')) {
                    const currentTransform = el.style.transform;
                    el.dataset.originalTransform = currentTransform;
                }
            }
        });

        // BETTER APPROACH: Scale the eye groups
        const eyeGroups = [
            document.querySelector('.eye-left'),
            document.querySelector('.eye-right')
        ];

        eyeGroups.forEach(group => {
            if (group) {
                group.style.transition = 'transform 0.1s ease-in-out';
                group.style.transformOrigin = 'center';
                group.style.transform = 'scaleY(0.1)';
            }
        });

        // Open eyes after 150ms
        setTimeout(() => {
            eyeGroups.forEach(group => {
                if (group) {
                    group.style.transform = 'scaleY(1)';
                }
            });
        }, 150);
    }

    followCursor(e) {
        if (this.isPasswordVisible) return;

        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }

        this.rafId = requestAnimationFrame(() => {
            const svg = document.querySelector('.premium-mascot-svg');
            if (!svg) return;

            const rect = svg.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Calculate distance from center
            const offsetX = e.clientX - centerX;
            const offsetY = e.clientY - centerY;

            // Sensitivity: How far mouse needs to move for full eye rotation
            const sensitivity = 300;

            // Clamp the ratio between -1 and 1
            const ratioX = Math.max(-1, Math.min(1, offsetX / sensitivity));
            const ratioY = Math.max(-1, Math.min(1, offsetY / sensitivity));

            // STRICT LIMIT: Max pixels the pupil can move inside the eye
            const maxPupilMove = 14;

            const moveX = ratioX * maxPupilMove;
            const moveY = ratioY * maxPupilMove;

            // Move Pupils (Eyes) - Strictly constrained
            this.pupils.forEach(pupil => {
                if (pupil) {
                    // Remove transition for instant response during mouse move
                    pupil.style.transition = 'none';
                    pupil.style.transform = `translate(${moveX}px, ${moveY}px)`;
                }
            });

            // Move Face (Parallax effect - moves slightly less)
            if (this.faceGroup) {
                this.faceGroup.style.transition = 'none';
                this.faceGroup.style.transform = `translate(${moveX * 0.5}px, ${moveY * 0.5}px)`;
            }

            // Move Body (Subtle movement)
            if (this.body) {
                this.body.style.transition = 'none';
                this.body.style.transform = `translate(${moveX * 0.2}px, ${moveY * 0.2}px)`;
            }
        });
    }

    coverEyes() {
        this.isPasswordVisible = true;

        // 1. Reset Eyes to Center (so they don't peek out)
        this.pupils.forEach(pupil => {
            if (pupil) {
                // Restore transition for smooth centering
                pupil.style.transition = 'transform 0.3s ease';
                pupil.style.transform = 'translate(0, 0)';
            }
        });

        // Restore transitions for face and body
        if (this.faceGroup) {
            this.faceGroup.style.transition = 'transform 0.3s ease';
            this.faceGroup.style.transform = 'translateY(10px)';
        }
        if (this.body) {
            this.body.style.transition = 'transform 0.3s ease';
            this.body.style.transform = 'translate(0, 0)';
        }

        // 2. Move Hands Up (Higher than before to fully cover)
        if (this.hands) {
            this.hands.style.opacity = '1';
            this.hands.style.transform = 'translateY(-80px)'; // Moved up higher to cover eyes
        }
    }

    uncoverEyes() {
        this.isPasswordVisible = false;

        // Restore transitions for smooth return
        this.pupils.forEach(pupil => {
            if (pupil) pupil.style.transition = 'transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        });
        if (this.faceGroup) {
            this.faceGroup.style.transition = 'transform 0.3s ease';
            this.faceGroup.style.transform = 'translateY(0)';
        }
        if (this.body) {
            this.body.style.transition = 'transform 0.3s ease';
        }

        if (this.hands) {
            this.hands.style.opacity = '0';
            this.hands.style.transform = 'translateY(50px)';
        }
    }

    shakeHeadNo() {
        const svg = document.querySelector('.premium-mascot-svg');
        if (svg) {
            svg.classList.add('shake-anim');
            setTimeout(() => svg.classList.remove('shake-anim'), 500);
        }
        if (this.mouth) {
            this.mouth.setAttribute('d', 'M 180 240 Q 200 230 220 240'); // Frown
            setTimeout(() => {
                this.mouth.setAttribute('d', 'M 180 230 Q 200 245 220 230'); // Smile
            }, 1500);
        }
    }

    celebrateSuccess() {
        const svg = document.querySelector('.premium-mascot-svg');
        if (svg) {
            svg.classList.add('jump-anim');
        }
        if (this.mouth) {
            this.mouth.setAttribute('d', 'M 170 220 Q 200 260 230 220'); // Big Smile
        }
    }
}

window.PremiumMascot = PremiumMascot;
