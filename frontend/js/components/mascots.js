/**
 * 4 Cute Mascot Characters for Login Page
 * Simple, friendly characters positioned on the left side
 */

function createMascots() {
    return `
        <div class="mascots-container">
            <!-- Mascot 1: Happy Blue Character (Top Left) -->
            <div class="mascot mascot-1">
                <svg viewBox="0 0 100 120" class="mascot-svg">
                    <!-- Body -->
                    <ellipse cx="50" cy="70" rx="35" ry="40" fill="#5B9FFF" stroke="#4080E0" stroke-width="2"/>
                    
                    <!-- Head -->
                    <circle cx="50" cy="35" r="28" fill="#7BB5FF" stroke="#4080E0" stroke-width="2"/>
                    
                    <!-- Eyes -->
                    <g class="mascot-eyes">
                        <circle cx="42" cy="32" r="4" fill="#2C3E50"/>
                        <circle cx="58" cy="32" r="4" fill="#2C3E50"/>
                        <circle cx="43" cy="31" r="1.5" fill="white"/>
                        <circle cx="59" cy="31" r="1.5" fill="white"/>
                    </g>
                    
                    <!-- Smile -->
                    <path d="M 38 42 Q 50 48 62 42" stroke="#2C3E50" stroke-width="2" fill="none" stroke-linecap="round"/>
                    
                    <!-- Rosy cheeks -->
                    <circle cx="35" cy="38" r="4" fill="#FF9AA2" opacity="0.6"/>
                    <circle cx="65" cy="38" r="4" fill="#FF9AA2" opacity="0.6"/>
                    
                    <!-- Arms -->
                    <ellipse cx="20" cy="75" rx="8" ry="18" fill="#5B9FFF" stroke="#4080E0" stroke-width="1.5" transform="rotate(-20 20 75)"/>
                    <ellipse cx="80" cy="75" rx="8" ry="18" fill="#5B9FFF" stroke="#4080E0" stroke-width="1.5" transform="rotate(20 80 75)"/>
                    
                    <!-- Feet -->
                    <ellipse cx="40" cy="108" rx="12" ry="8" fill="#4080E0"/>
                    <ellipse cx="60" cy="108" rx="12" ry="8" fill="#4080E0"/>
                    
                    <!-- Antenna/Hair -->
                    <line x1="50" y1="8" x2="50" y2="15" stroke="#4080E0" stroke-width="2" stroke-linecap="round"/>
                    <circle cx="50" cy="6" r="3" fill="#FFD93D"/>
                </svg>
            </div>

            <!-- Mascot 2: Pink Heart Character (Top Right) -->
            <div class="mascot mascot-2">
                <svg viewBox="0 0 100 120" class="mascot-svg">
                    <!-- Body (heart shape) -->
                    <path d="M 50 100 L 20 60 Q 15 40 25 30 Q 35 20 50 35 Q 65 20 75 30 Q 85 40 80 60 Z" 
                          fill="#FF6B9D" stroke="#E5437A" stroke-width="2"/>
                    
                    <!-- Face circle overlay -->
                    <circle cx="50" cy="50" r="22" fill="#FFB3D9" stroke="#E5437A" stroke-width="2"/>
                    
                    <!-- Eyes -->
                    <g class="mascot-eyes">
                        <circle cx="44" cy="48" r="3.5" fill="#2C3E50"/>
                        <circle cx="56" cy="48" r="3.5" fill="#2C3E50"/>
                        <circle cx="45" cy="47" r="1.3" fill="white"/>
                        <circle cx="57" cy="47" r="1.3" fill="white"/>
                    </g>
                    
                    <!-- Happy smile -->
                    <path d="M 42 56 Q 50 62 58 56" stroke="#2C3E50" stroke-width="2" fill="none" stroke-linecap="round"/>
                    
                    <!-- Blush -->
                    <ellipse cx="38" cy="52" rx="4" ry="3" fill="#FF9AA2" opacity="0.7"/>
                    <ellipse cx="62" cy="52" rx="4" ry="3" fill="#FF9AA2" opacity="0.7"/>
                    
                    <!-- Little arms -->
                    <ellipse cx="22" cy="65" rx="6" ry="12" fill="#FF6B9D" stroke="#E5437A" stroke-width="1.5" transform="rotate(-25 22 65)"/>
                    <ellipse cx="78" cy="65" rx="6" ry="12" fill="#FF6B9D" stroke="#E5437A" stroke-width="1.5" transform="rotate(25 78 65)"/>
                    
                    <!-- Sparkles -->
                    <path d="M 20 30 L 22 35 L 20 40 L 18 35 Z" fill="#FFD93D"/>
                    <path d="M 80 35 L 82 38 L 80 41 L 78 38 Z" fill="#FFD93D"/>
                </svg>
            </div>

            <!-- Mascot 3: Green Plant Character (Bottom Left) -->
            <div class="mascot mascot-3">
                <svg viewBox="0 0 100 120" class="mascot-svg">
                    <!-- Pot/Body -->
                    <path d="M 30 70 L 35 105 L 65 105 L 70 70 Z" fill="#8B5A3C" stroke="#6B4423" stroke-width="2"/>
                    <ellipse cx="50" cy="70" rx="20" ry="8" fill="#A0664F"/>
                    
                    <!-- Main body (bulb) -->
                    <ellipse cx="50" cy="55" rx="25" ry="28" fill="#7FC97F" stroke="#5FA65F" stroke-width="2"/>
                    
                    <!-- Face -->
                    <g class="mascot-eyes">
                        <circle cx="43" cy="52" r="4" fill="#2C3E50"/>
                        <circle cx="57" cy="52" r="4" fill="#2C3E50"/>
                        <circle cx="44" cy="51" r="1.5" fill="white"/>
                        <circle cx="58" cy="51" r="1.5" fill="white"/>
                    </g>
                    
                    <!-- Cute smile -->
                    <path d="M 40 60 Q 50 65 60 60" stroke="#2C3E50" stroke-width="2" fill="none" stroke-linecap="round"/>
                    
                    <!-- Leaves on top -->
                    <ellipse cx="35" cy="32" rx="12" ry="18" fill="#5FA65F" transform="rotate(-30 35 32)"/>
                    <ellipse cx="50" cy="28" rx="12" ry="20" fill="#7FC97F"/>
                    <ellipse cx="65" cy="32" rx="12" ry="18" fill="#5FA65F" transform="rotate(30 65 32)"/>
                    
                    <!-- Rosy cheeks -->
                    <circle cx="37" cy="56" r="4" fill="#FF9AA2" opacity="0.6"/>
                    <circle cx="63" cy="56" r="4" fill="#FF9AA2" opacity="0.6"/>
                </svg>
            </div>

            <!-- Mascot 4: Yellow Star Character (Bottom Right) -->
            <div class="mascot mascot-4">
                <svg viewBox="0 0 100 120" class="mascot-svg">
                    <!-- Star body -->
                    <path d="M 50 15 L 58 45 L 90 45 L 65 65 L 75 95 L 50 75 L 25 95 L 35 65 L 10 45 L 42 45 Z" 
                          fill="#FFD93D" stroke="#FFC107" stroke-width="2"/>
                    
                    <!-- Face circle in center -->
                    <circle cx="50" cy="55" r="20" fill="#FFF59D" stroke="#FFC107" stroke-width="2"/>
                    
                    <!-- Happy closed eyes -->
                    <g class="mascot-eyes">
                        <path d="M 42 52 Q 44 50 46 52" stroke="#2C3E50" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                        <path d="M 54 52 Q 56 50 58 52" stroke="#2C3E50" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                    </g>
                    
                    <!-- Big happy smile -->
                    <path d="M 40 60 Q 50 68 60 60" stroke="#2C3E50" stroke-width="2" fill="none" stroke-linecap="round"/>
                    
                    <!-- Rosy cheeks -->
                    <circle cx="38" cy="58" r="4" fill="#FF9AA2" opacity="0.6"/>
                    <circle cx="62" cy="58" r="4" fill="#FF9AA2" opacity="0.6"/>
                    
                    <!-- Sparkle effects -->
                    <circle cx="30" cy="30" r="2" fill="white" opacity="0.8"/>
                    <circle cx="70" cy="35" r="2" fill="white" opacity="0.8"/>
                    <circle cx="25" cy="70" r="2" fill="white" opacity="0.8"/>
                    <circle cx="75" cy="75" r="2" fill="white" opacity="0.8"/>
                </svg>
            </div>
        </div>
    `;
}

// Export for use
window.createMascots = createMascots;
