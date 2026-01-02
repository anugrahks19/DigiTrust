// ==================================== 
// History View Component
// ====================================

async function loadUserHistory() {
    const container = document.getElementById('historyContainer');

    //Show loading
    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading validation history...</p>
        </div>
    `;

    try {
        // ID is inferred from the Auth Token by backend
        const data = await apiRequest(`/api/history`);

        if (!data.history || data.history.length === 0) {
            container.innerHTML = `
                <div class="empty-state glass">
                    <div class="empty-icon">📭</div>
                    <h3>No Validation History</h3>
                    <p>Submit an address to get started!</p>
                    <button class="btn btn-primary mt-md" onclick="switchView('submit')">
                        Validate Address
                    </button>
                </div>
            `;
            return;
        }

        // Display history
        const html = data.history.map(item => {
            const vlColor = getVLColor(item.vl);
            const address = item.address;
            const addressStr = `${address.house_no}, ${address.street}, ${address.locality}, ${address.city} - ${address.pin}`;

            return `
                <div class="history-card glass">
                    <div class="history-header">
                        <div>
                            <div class="history-address">${addressStr}</div>
                            <div class="history-digipin">DIGIPIN: ${address.digipin}</div>
                        </div>
                        <div class="history-badges">
                            <div class="acs-mini">${Math.round(item.acs)}</div>
                            <div class="vl-mini" style="background: ${vlColor};">${item.vl}</div>
                        </div>
                    </div>
                    <div class="history-footer">
                        <span class="history-date">📅 ${formatDate(item.created_at)}</span>
                        <div class="history-actions">
                            ${item.token_available ? `
                                <button class="btn-mini btn-primary" onclick="downloadToken('${item.request_id}')">
                                    🎫 Token
                                </button>
                            ` : ''}
                            <button class="btn-mini btn-outline" onclick="viewHistoryDetails('${item.request_id}')">
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="info-note glass">
                <p>ℹ️ <strong>Note:</strong> Validation Tokens are only generated for addresses with <strong>High Confidence</strong> (Score 65+).</p>
            </div>
            ${html}
        `;

    } catch (error) {
        container.innerHTML = `
            <div class="error-state glass">
                <div class="error-icon">❌</div>
                <h3>Failed to Load History</h3>
                <p>${error.message}</p>
                <button class="btn btn-outline mt-md" onclick="loadUserHistory()">
                    Retry
                </button>
            </div>
        `;
    }
}

async function viewHistoryDetails(requestId) {
    try {
        const result = await apiRequest(`/api/result/${requestId}`);
        appState.lastValidationResult = result;
        displayValidationResult(result);
        switchView('result');
    } catch (error) {
        showNotification('Failed to load details', 'error');
    }
}

// Add CSS for history view
const historyStyles = document.createElement('style');
historyStyles.textContent = `
    .history-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
    }
    
    .history-card {
        padding: var(--spacing-lg);
        border-radius: var(--radius-lg);
        transition: all var(--transition-base);
    }
    
    .history-card:hover {
        transform: translateX(4px);
        box-shadow: var(--shadow-lg);
    }
    
    .history-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--spacing-md);
    }
    
    .history-address {
        font-weight: 600;
        font-size: 1.125rem;
        margin-bottom: var(--spacing-xs);
    }
    
    .history-digipin {
        color: var(--text-secondary);
        font-size: 0.875rem;
        font-family: monospace;
    }
    
    .history-badges {
        display: flex;
        gap: var(--spacing-xs);
        align-items: center;
    }
    
    .acs-mini {
        padding: var(--spacing-xs) var(--spacing-sm);
        background: var(--gradient-primary);
        color: white;
        border-radius: var(--radius-sm);
        font-weight: 700;
        font-size: 1.25rem;
    }
    
    .vl-mini {
        padding: var(--spacing-xs) var(--spacing-sm);
        color: white;
        border-radius: var(--radius-sm);
        font-weight: 700;
        font-size: 0.875rem;
    }
    
    .history-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: var(--spacing-md);
        border-top: 1px solid var(--border);
    }
    
    .history-date {
        color: var(--text-muted);
        font-size: 0.875rem;
    }
    
    .history-actions {
        display: flex;
        gap: var(--spacing-sm);
    }
    
    .btn-mini {
        padding: var(--spacing-xs) var(--spacing-sm);
        font-size: 0.875rem;
        border-radius: var(--radius-sm);
        border: none;
        cursor: pointer;
        font-weight: 600;
        transition: all var(--transition-base);
    }
    
    .btn-mini.btn-primary {
        background: var(--primary);
        color: white;
    }
    
    .btn-mini.btn-outline {
        background: transparent;
        color: var(--primary);
        border: 1px solid var(--primary);
    }
    
    .btn-mini:hover {
        transform: scale(1.05);
    }
    
    .empty-state, .error-state, .loading-state {
        text-align: center;
        padding: var(--spacing-xl);
        border-radius: var(--radius-xl);
    }
    
    .empty-icon, .error-icon {
        font-size: 4rem;
        margin-bottom: var(--spacing-md);
    }
    
    .spinner {
        width: 50px;
        height: 50px;
        margin: 0 auto var(--spacing-md);
        border: 4px solid var(--border);
        border-top-color: var(--primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .info-note {
        padding: var(--spacing-md);
        margin-bottom: var(--spacing-md);
        border-radius: var(--radius-md);
        border-left: 4px solid var(--primary);
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
    }
`;
document.head.appendChild(historyStyles);
