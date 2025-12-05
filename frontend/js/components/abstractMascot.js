/**
 * Abstract Digital Guardian (Left Side Only)
 * Design: High-tech Cyber Eye with rotating rings
 * Features: Follows cursor, mechanical shutters for privacy, color-changing states
 */

class AbstractMascot {
    constructor() {
        this.isPasswordVisible = false;
        this.eyeGroup = null;
        this.pupil = null;
        this.shutterTop = null;
        this.shutterBottom = null;
        this.outerRing = null;
        this.innerRing = null;
    }

    createMascot() {
        return `
            <div class="abstract-mascot-container">
                <svg viewBox="0 0 300 300" class="abstract-mascot-svg">
                    <defs>
                        <linearGradient id="cyber-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#4facfe;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#00f2fe;stop-opacity:1" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>

                    <!-- Outer Rotating Ring -->
                    <g class="ring-outer">
                        <circle cx="150" cy="150" r="110" fill="none" stroke="url(#cyber-gradient)" stroke-width="2" stroke-dasharray="20, 10" opacity="0.6"/>
                        <circle cx="150" cy="150" r="100" fill="none" stroke="#fff" stroke-width="1" stroke-dasharray="50, 30" opacity="0.4"/>
                    </g>

                    <!-- Inner Rotating Ring -->
                    <g class="ring-inner">
                        <path d="M 150 60 L 150 70 M 150 230 L 150 240 M 60 150 L 70 150 M 230 150 L 240 150" 
                              stroke="#fff" stroke-width="3" stroke-linecap="round"/>
                        <circle cx="150" cy="150" r="85" fill="none" stroke="url(#cyber-gradient)" stroke-width="4" opacity="0.8"/>
                    </g>

                    <!-- Main Eye Container -->
                    <g class="main-eye-group">
                        <!-- Sclera (Eye White/Background) -->
                        <circle cx="150" cy="150" r="70" fill="#0f172a" stroke="#4facfe" stroke-width="2"/>
                        
                        <!-- The Pupil (Follows Cursor) -->
                        <g class="cyber-pupil">
                            <circle cx="150" cy="150" r="30" fill="url(#cyber-gradient)" filter="url(#glow)"/>
                            <circle cx="150" cy="150" r="15" fill="#fff" opacity="0.8"/>
                        </g>
                    </g>

                    <!-- Mechanical Shutters (Privacy Mode) -->
                    <!-- Top Shutter -->
                    <path class="shutter-top" d="M 50 150 A 100 100 0 0 1 250 150 L 250 50 L 50 50 Z" 
                          fill="#1e293b" stroke="#4facfe" stroke-width="2" transform="translate(0, -110)"/>
                    
                    <!-- Bottom Shutter -->
                    <path class="shutter-bottom" d="M 50 150 A 100 100 0 0 0 250 150 L 250 250 L 50 250 Z" 
                          fill="#1e293b" stroke="#4facfe" stroke-width="2" transform="translate(0, 110)"/>

                    <!-- Status Light (For Error/Success) -->
                    <circle class="status-light" cx="150" cy="260" r="5" fill="#4facfe" filter="url(#glow)"/>
                </svg>
            </div>
        `;
    }

    attachToLeftSide(leftContent) {
        if (!leftContent) return;
        leftContent.innerHTML = this.createMascot();

        // Get References
        this.eyeGroup = document.querySelector('.main-eye-group');
        this.pupil = document.querySelector('.cyber-pupil');
        this.shutterTop = document.querySelector('.shutter-top');
        this.shutterBottom = document.querySelector('.shutter-bottom');
        this.outerRing = document.querySelector('.ring-outer');
        this.innerRing = document.querySelector('.ring-inner');
        this.statusLight = document.querySelector('.status-light');

        this.setupEventListeners();
    }

    setupEventListeners() {
        setTimeout(() => {
            const modal = document.getElementById('adminLoginPage');
            if (!modal) return;

            // Follow Cursor
            modal.addEventListener('mousemove', (e) => this.followCursor(e));

            // Password Toggle
            const toggleBtn = document.getElementById('togglePassword');
            const passwordInput = document.getElementById('adminPasswordInput');

            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    setTimeout(() => {
                        if (passwordInput.type === 'text') {
                            this.activatePrivacyMode();
                        } else {
                            this.deactivatePrivacyMode();
                        }
                    }, 50);
                });
            }
        }, 500);
    }

    followCursor(e) {
        if (this.isPasswordVisible || !this.pupil) return;

        const rect = document.querySelector('.abstract-mascot-svg').getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const angleX = (e.clientX - centerX) / rect.width;
        const angleY = (e.clientY - centerY) / rect.height;

        // Limit movement to keep inside eye
        const maxMove = 35;
        const moveX = Math.max(-maxMove, Math.min(maxMove, angleX * 60));
        const moveY = Math.max(-maxMove, Math.min(maxMove, angleY * 60));

        this.pupil.style.transform = `translate(${moveX}px, ${moveY}px)`;
    }

    activatePrivacyMode() {
        this.isPasswordVisible = true;
        // Shutters close completely
        this.shutterTop.style.transform = 'translate(0, 0)';
        this.shutterBottom.style.transform = 'translate(0, 0)';

        // Pupil centers
        this.pupil.style.transform = 'translate(0, 0)';

        // Rings stop or slow down
        this.outerRing.style.animationDuration = '10s';
    }

    deactivatePrivacyMode() {
        this.isPasswordVisible = false;
        // Shutters open
        this.shutterTop.style.transform = 'translate(0, -110px)';
        this.shutterBottom.style.transform = 'translate(0, 110px)';

        // Rings resume speed
        this.outerRing.style.animationDuration = '20s';
    }

    shakeHeadNo() {
        const svg = document.querySelector('.abstract-mascot-svg');
        if (svg) {
            svg.classList.add('shake-error');

            // Turn Red
            this.updateColor('#ff4b4b', '#ff0000'); // Red

            setTimeout(() => {
                svg.classList.remove('shake-error');
                this.resetColor();
            }, 1000);
        }
    }

    celebrateSuccess() {
        const svg = document.querySelector('.abstract-mascot-svg');
        if (svg) {
            // Turn Green
            this.updateColor('#00b09b', '#96c93d'); // Green

            // Spin fast
            this.outerRing.style.animation = 'spin 0.5s linear infinite';
            this.innerRing.style.animation = 'spin-reverse 0.5s linear infinite';

            // Pulse
            svg.classList.add('pulse-success');
        }
    }

    updateColor(color1, color2) {
        const gradient = document.getElementById('cyber-gradient');
        if (gradient) {
            gradient.children[0].style.stopColor = color1;
            gradient.children[1].style.stopColor = color2;
        }
        if (this.statusLight) this.statusLight.setAttribute('fill', color1);
    }

    resetColor() {
        // Back to Blue
        this.updateColor('#4facfe', '#00f2fe');
        if (this.outerRing) this.outerRing.style.animation = '';
        if (this.innerRing) this.innerRing.style.animation = '';
        const svg = document.querySelector('.abstract-mascot-svg');
        if (svg) svg.classList.remove('pulse-success');
    }
}

window.AbstractMascot = AbstractMascot;
