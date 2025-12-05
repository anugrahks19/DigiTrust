// ====================================
// Validation Result Display Component
// ====================================

function displayValidationResult(result) {
    const container = document.querySelector('#resultView .container');

    const vlColor = getVLColor(result.vl);
    const vlLabel = getVLLabel(result.vl);

    const html = `
        <div class="result-hero">
            <button class="btn btn-outline mb-md" onclick="switchView('submit')">
                ← Back to Submit
            </button>
            
            <h1 class="page-title text-center">Validation Result</h1>
            
            <!-- ACS Gauge -->
            <div class="acs-gauge-card glass">
                <div class="acs-gauge-container">
                    <svg class="acs-gauge" viewBox="0 0 200 200" width="200" height="200">
                        <circle cx="100" cy="100" r="85" fill="none" stroke="var(--border)" stroke-width="12"/>
                        <circle 
                            cx="100" 
                            cy="100" 
                            r="85" 
                            fill="none" 
                            stroke="url(#gradient)" 
                            stroke-width="12"
                            stroke-dasharray="${(result.acs / 100) * 534} 534"
                            stroke-linecap="round"
                            transform="rotate(-90 100 100)"
                            class="acs-progress"
                        />
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:hsl(240, 85%, 60%);stop-opacity:1" />
                                <stop offset="100%" style="stop-color:hsl(280, 75%, 65%);stop-opacity:1" />
                            </linearGradient>
                        </defs>
                        <text x="100" y="95" text-anchor="middle" class="acs-score">${Math.round(result.acs)}</text>
                        <text x="100" y="115" text-anchor="middle" class="acs-label">ACS</text>
                    </svg>
                </div>
                
                <!-- VL Badge -->
                <div class="vl-badge-large" style="background: ${vlColor};">
                    <div class="vl-code">${result.vl}</div>
                    <div class="vl-text">${vlLabel}</div>
                </div>
            </div>
        </div>
        
        <!-- Advanced Metrics Section -->
        ${result.fraud_risk || result.position_confidence_meters || result.category_avg_comparison ? `
            <div class="advanced-metrics-grid">
                ${result.fraud_risk ? `
                    <div class="metric-card glass" style="border-left: 4px solid ${getFraudRiskColor(result.fraud_risk.risk_level)};">
                        <div class="metric-icon">${getFraudRiskIcon(result.fraud_risk.risk_level)}</div>
                        <div class="metric-content">
                            <div class="metric-label">Fraud Risk</div>
                            <div class="metric-value">${result.fraud_risk.risk_percentage.toFixed(1)}%</div>
                            <div class="metric-sublabel">${result.fraud_risk.risk_level.toUpperCase()}</div>
                            ${result.fraud_risk.suspicious_patterns.length > 0 ? `
                                <div class="metric-warning">⚠️ ${result.fraud_risk.suspicious_patterns.join(', ')}</div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
                
                ${result.position_confidence_meters ? `
                    <div class="metric-card glass">
                        <div class="metric-icon">📍</div>
                        <div class="metric-content">
                            <div class="metric-label">Position Confidence</div>
                            <div class="metric-value">±${result.position_confidence_meters}m</div>
                            <div class="metric-sublabel">${getConfidenceLabel(result.position_confidence_meters)}</div>
                        </div>
                    </div>
                ` : ''}
                
                ${result.escalation_path ? `
                    <div class="metric-card glass">
                        <div class="metric-icon">${getEscalationIcon(result.escalation_path)}</div>
                        <div class="metric-content">
                            <div class="metric-label">Processing Path</div>
                            <div class="metric-value">${formatEscalationPath(result.escalation_path)}</div>
                            <div class="metric-sublabel">${getEscalationDescription(result.escalation_path)}</div>
                        </div>
                    </div>
                ` : ''}
                
                ${result.category_avg_comparison ? `
                    <div class="metric-card glass">
                        <div class="metric-icon">📊</div>
                        <div class="metric-content">
                            <div class="metric-label">${result.category_avg_comparison.category} Average</div>
                            <div class="metric-value">${result.category_avg_comparison.average_acs.toFixed(1)}</div>
                            <div class="metric-sublabel">
                                You: ${result.acs.toFixed(1)} 
                                <span style="color: ${result.category_avg_comparison.difference >= 0 ? '#10b981' : '#ef4444'};">
                                    ${result.category_avg_comparison.difference >= 0 ? '+' : ''}${result.category_avg_comparison.difference.toFixed(1)}
                                </span>
                            </div>
                            <div class="metric-percentile">${result.category_avg_comparison.percentile}th percentile</div>
                        </div>
                    </div>
                ` : ''}
            </div>
        ` : ''}
        
        <!-- Evidence Breakdown -->
        <div class="evidence-section glass">
            <h2 class="section-title">Evidence Breakdown</h2>
            <p class="section-subtitle">How we calculated your Address Confidence Score</p>
            
            <div class="evidence-chart-container">
                <canvas id="evidenceChart" width="400" height="200"></canvas>
            </div>
            
            <div class="evidence-details">
                ${result.evidence.map(ev => `
                    <div class="evidence-item">
                        <div class="evidence-header">
                            <span class="evidence-type">${formatEvidenceType(ev.type)}</span>
                            <span class="evidence-score">${Math.round(ev.score)}/100</span>
                        </div>
                        <div class="evidence-progress-bar">
                            <div class="evidence-progress-fill" style="width: ${ev.score}%; background: ${getEvidenceColor(ev.type)};"></div>
                        </div>
                        <div class="evidence-weight">Weight: ${Math.round(ev.weight * 100)}%</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Reason Codes -->
        <div class="reason-codes-section glass">
            <h3>📋 Reason Codes</h3>
            <div class="reason-codes">
                ${result.reason_codes.map(code => `
                    <span class="reason-badge">${formatReasonCode(code)}</span>
                `).join('')}
            </div>
        </div>
        
        <!-- Suggestions -->
        ${result.suggestions && result.suggestions.length > 0 ? `
            <div class="suggestions-section glass">
                <h3>💡 Suggestions to Improve Score</h3>
                <ul class="suggestions-list">
                    ${result.suggestions.map(suggestion => `
                        <li class="suggestion-item">${suggestion}</li>
                    `).join('')}
                </ul>
            </div>
        ` : ''}
        
        <!-- Actions -->
        <div class="actions-section">
            ${result.token_available ? `
                <button class="btn btn-primary btn-lg" onclick="downloadToken('${result.request_id}')">
                    🎫 Download Validation Token
                </button>
            ` : result.acs < 65 ? `
                <button class="btn btn-primary btn-lg" onclick="requestHumanVerification('${result.request_id}')">
                    👤 Request Human Verification
                </button>
            ` : ''}
            
            <button class="btn btn-outline" onclick="viewInAdmin('${result.request_id}')">
                🔍 View in Admin Panel
            </button>
        </div>
    `;

    container.innerHTML = html;

    // Render evidence chart
    setTimeout(() => {
        renderEvidenceChart(result.evidence);
    }, 100);
}

function renderEvidenceChart(evidence) {
    const ctx = document.getElementById('evidenceChart');
    if (!ctx) return;

    const labels = evidence.map(ev => formatEvidenceType(ev.type));
    const scores = evidence.map(ev => ev.score);
    const colors = evidence.map(ev => getEvidenceColor(ev.type));

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Score',
                data: scores,
                backgroundColor: colors,
                borderRadius: 8,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function formatEvidenceType(type) {
    const names = {
        'geo': '📍 Geographic',
        'geo_precision': '🎯 Geo Precision',
        'temporal': '🕒 Temporal',
        'temporal_decay': '⏳ Temporal Decay',
        'iot': '📱 IoT Signals',
        'doc': '📄 Documentary',
        'crowd': '👥 Community',
        'linguistic': '🗣️ Linguistic',
        'cross_corpus': '🔗 Cross-Validation',
        'history': '📜 History'
    };
    return names[type] || type;
}

function getEvidenceColor(type) {
    const colors = {
        'geo': 'hsl(240, 85%, 65%)',
        'geo_precision': 'hsl(250, 85%, 65%)',
        'temporal': 'hsl(260, 80%, 65%)',
        'temporal_decay': 'hsl(270, 80%, 65%)',
        'iot': 'hsl(280, 75%, 65%)',
        'doc': 'hsl(300, 70%, 65%)',
        'crowd': 'hsl(320, 85%, 65%)',
        'linguistic': 'hsl(30, 85%, 65%)',
        'cross_corpus': 'hsl(180, 75%, 65%)',
        'history': 'hsl(200, 75%, 65%)'
    };
    return colors[type] || 'hsl(220, 60%, 65%)';
}

function getFraudRiskColor(level) {
    const colors = {
        'low': '#10b981',
        'medium': '#f59e0b',
        'high': '#ef4444'
    };
    return colors[level] || '#6b7280';
}

function getFraudRiskIcon(level) {
    const icons = {
        'low': '✅',
        'medium': '⚠️',
        'high': '🚨'
    };
    return icons[level] || 'ℹ️';
}

function getConfidenceLabel(meters) {
    if (meters <= 50) return 'Excellent';
    if (meters <= 150) return 'Very Good';
    if (meters <= 300) return 'Good';
    if (meters <= 500) return 'Moderate';
    return 'Low';
}

function getEscalationIcon(path) {
    const icons = {
        'auto_token': '⚡',
        'iot_check': '📱',
        'crowd_validation': '👥',
        'postman_queue': '📮',
        'fraud_queue': '🚨'
    };
    return icons[path] || '⏳';
}

function formatEscalationPath(path) {
    const names = {
        'auto_token': 'Auto Token',
        'iot_check': 'IoT Check',
        'crowd_validation': 'Crowd Validation',
        'postman_queue': 'Postman Queue',
        'fraud_queue': 'Fraud Review'
    };
    return names[path] || path;
}

function getEscalationDescription(path) {
    const descriptions = {
        'auto_token': 'Instant issuance',
        'iot_check': '5-second verification',
        'crowd_validation': '30-second community check',
        'postman_queue': 'Human verification required',
        'fraud_queue': 'Manual fraud investigation'
    };
    return descriptions[path] || '';
}

function formatReasonCode(code) {
    return code.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

async function downloadToken(requestId) {
    try {
        const tokenData = await apiRequest(`/api/token/${requestId}`);

        // Create download modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content glass" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>🎫 Validation Token</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body" style="text-align: center;">
                    <div id="qrcode" style="margin: 20px auto;"></div>
                    <p><strong>Token ID:</strong> ${tokenData.token_id}</p>
                    <p style="word-break: break-all; font-size: 0.85rem; color: var(--text-muted);">
                        ${tokenData.jwt.substring(0, 50)}...
                    </p>
                    <p><strong>Issued:</strong> ${formatDate(tokenData.issued_at)}</p>
                    <p><strong>Expires:</strong> ${formatDate(tokenData.expires_at)}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="copyToken('${tokenData.jwt}')">
                        📋 Copy JWT Token
                    </button>
                    <button class="btn btn-outline" onclick="this.closest('.modal').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Generate QR code
        new QRCode(document.getElementById('qrcode'), {
            text: tokenData.qr_data,
            width: 200,
            height: 200
        });

        showNotification('Token generated successfully!', 'success');
    } catch (error) {
        console.error('Token download error:', error);
    }
}

function copyToken(jwt) {
    navigator.clipboard.writeText(jwt).then(() => {
        showNotification('Token copied to clipboard!', 'success');
    });
}

async function requestHumanVerification(requestId) {
    showNotification('Human verification request submitted. An agent will review your address.', 'info');
    // In real implementation, this would create a request in the system
}

function viewInAdmin(requestId) {
    switchView('admin');
    // Could auto-load this specific request in admin view
}

// Add CSS for validation result components
const resultStyles = document.createElement('style');
resultStyles.textContent = `
    .result-hero {
        text-align: center;
        margin-bottom: var(--spacing-xl);
    }
    
    .acs-gauge-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-lg);
        padding: var(--spacing-xl);
        border-radius: var(--radius-xl);
        margin: var(--spacing-lg) 0;
    }
    
    .acs-gauge-container {
        position: relative;
    }
    
    .acs-progress {
        transition: stroke-dasharray 1.5s ease-out;
    }
    
    .acs-score {
        font-size: 48px;
        font-weight: 900;
        font-family: var(--font-display);
        fill: var(--text-primary);
    }
    
    .acs-label {
        font-size: 14px;
        font-weight: 600;
        fill: var(--text-secondary);
    }
    
    .vl-badge-large {
        padding: var(--spacing-md) var(--spacing-xl);
        border-radius: var(--radius-lg);
        color: white;
        text-align: center;
    }
    
    .vl-code {
        font-size: 2rem;
        font-weight: 900;
        font-family: var(--font-display);
    }
    
    .vl-text {
        font-size: 0.9rem;
        opacity: 0.9;
    }
    
    .evidence-section, .reason-codes-section, .suggestions-section {
        padding: var(--spacing-xl);
        border-radius: var(--radius-xl);
        margin-bottom: var(--spacing-lg);
    }
    
    .section-title {
        margin-bottom: var(--spacing-xs);
    }
    
    .section-subtitle {
        color: var(--text-secondary);
        margin-bottom: var(--spacing-lg);
    }
    
    .evidence-chart-container {
        margin-bottom: var(--spacing-lg);
    }
    
    .evidence-item {
        margin-bottom: var(--spacing-md);
        padding: var(--spacing-md);
        background: var(--surface);
        border-radius: var(--radius-md);
    }
    
    .evidence-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: var(--spacing-xs);
        font-weight: 600;
    }
    
    .evidence-progress-bar {
        height: 8px;
        background: var(--border);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: var(--spacing-xs);
    }
    
    .evidence-progress-fill {
        height: 100%;
        transition: width 1s ease-out;
    }
    
    .evidence-weight {
        font-size: 0.85rem;
        color: var(--text-muted);
    }
    
    .reason-codes {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-sm);
    }
    
    .reason-badge {
        padding: var(--spacing-xs) var(--spacing-sm);
        background: var(--gradient-soft);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
        font-weight: 500;
    }
    
    .suggestions-list {
        list-style-position: inside;
        color: var(--text-secondary);
    }
    
    .suggestion-item {
        padding: var(--spacing-sm);
        margin-bottom: var(--spacing-xs);
        background: var(--surface);
        border-radius: var(--radius-sm);
    }
    
    .actions-section {
        display: flex;
        gap: var(--spacing-md);
        flex-wrap: wrap;
    }
    
    .actions-section .btn {
        flex: 1;
        min-width: 200px;
    }
    
    /* Advanced Metrics Grid */
    .advanced-metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
    }
    
    .metric-card {
        padding: var(--spacing-lg);
        border-radius: var(--radius-lg);
        transition: all var(--transition-base);
    }
    
    .metric-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
    }
    
    .metric-icon {
        font-size: 2rem;
        margin-bottom: var(--spacing-sm);
    }
    
    .metric-content {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
    }
    
    .metric-label {
        font-size: 0.85rem;
        color: var(--text-muted);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .metric-value {
        font-size: 1.75rem;
        font-weight: 900;
        font-family: var(--font-display);
        background: var(--gradient-primary);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    
    .metric-sublabel {
        font-size: 0.9rem;
        color: var(--text-secondary);
        font-weight: 500;
    }
    
    .metric-warning {
        margin-top: var(--spacing-xs);
        padding: var(--spacing-xs);
        background: rgba(239, 68, 68, 0.1);
        border-left: 3px solid #ef4444;
        border-radius: var(--radius-sm);
        font-size: 0.85rem;
        color: #dc2626;
        font-weight: 500;
    }
    
    .metric-percentile {
        margin-top: var(--spacing-xs);
        font-size: 0.85rem;
        padding: 0.25rem 0.5rem;
        background: var(--gradient-soft);
        border-radius: var(--radius-sm);
        display: inline-block;
        font-weight: 600;
    }
`;
document.head.appendChild(resultStyles);
