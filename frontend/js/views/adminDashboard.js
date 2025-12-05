// ====================================
// Admin Dashboard View Component
// ====================================

async function loadAdminDashboard() {
    const kpiContainer = document.getElementById('kpiCards');
    const queueContainer = document.getElementById('queueTable');

    // Show loading
    kpiContainer.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
    queueContainer.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

    try {
        // Load KPIs
        const kpiData = await apiRequest('/api/admin/dashboard');

        // Display KPI cards
        kpiContainer.innerHTML = `
            <div class="kpi-card glass">
                <div class="kpi-icon">📊</div>
                <div class="kpi-value">${kpiData.total_validations}</div>
                <div class="kpi-label">Total Validations</div>
            </div>
            
            <div class="kpi-card glass">
                <div class="kpi-icon">⏳</div>
                <div class="kpi-value">${kpiData.pending_validations}</div>
                <div class="kpi-label">Pending Review</div>
            </div>
            
            <div class="kpi-card glass">
                <div class="kpi-icon">⭐</div>
                <div class="kpi-value">${kpiData.avg_acs.toFixed(1)}</div>
                <div class="kpi-label">Average ACS</div>
            </div>
            
            <div class="kpi-card glass">
                <div class="kpi-icon">🔥</div>
                <div class="kpi-value">${kpiData.recent_validations}</div>
                <div class="kpi-label">Last 24 Hours</div>
            </div>
        `;

        // Load validation queue
        const queueData = await apiRequest('/api/admin/queue?limit=20');

        if (!queueData.queue || queueData.queue.length === 0) {
            queueContainer.innerHTML = `
                <div class="empty-state glass">
                    <p>No validations in queue</p>
                </div>
            `;
            return;
        }

        // Display queue table
        const queueHtml = `
            <div class="queue-table glass">
                <table>
                    <thead>
                        <tr>
                            <th>Request ID</th>
                            <th>Address</th>
                            <th>Status</th>
                            <th>ACS</th>
                            <th>VL</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${queueData.queue.map(item => `
                            <tr>
                                <td><code class="request-id">${item.request_id.substring(0, 12)}...</code></td>
                                <td class="address-cell">${item.address}</td>
                                <td><span class="status-badge status-${item.status}">${item.status}</span></td>
                                <td>${item.acs !== null ? Math.round(item.acs) : '-'}</td>
                                <td>${item.vl ? `<span class="vl-badge-sm" style="background: ${getVLColor(item.vl)};">${item.vl}</span>` : '-'}</td>
                                <td class="date-cell">${formatDate(item.created_at)}</td>
                                <td>
                                    <button class="btn-mini btn-primary" onclick="adminReviewRequest('${item.request_id}')">
                                        Review
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        queueContainer.innerHTML = queueHtml;

    } catch (error) {
        kpiContainer.innerHTML = `<div class="error-state">Failed to load dashboard</div>`;
        queueContainer.innerHTML = `<div class="error-state">${error.message}</div>`;
    }
}

async function adminReviewRequest(requestId) {
    try {
        const details = await apiRequest(`/api/admin/review/${requestId}`);

        // Get agent signals for THIS SPECIFIC REQUEST
        const allSignals = JSON.parse(localStorage.getItem('agent_signals') || '{}');
        const requestSignals = allSignals[requestId] || {};
        const postmanSignal = requestSignals.postman || false;
        const deliverySignal = requestSignals.delivery || false;

        // Show detailed review modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content glass" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>📋 Review Validation Request</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="review-section">
                        <h3>Address Details</h3>
                        <div class="detail-grid">
                            <div><strong>House No:</strong> ${details.address.house_no}</div>
                            <div><strong>Street:</strong> ${details.address.street}</div>
                            <div><strong>Locality:</strong> ${details.address.locality}</div>
                            <div><strong>City:</strong> ${details.address.city}</div>
                            <div><strong>District:</strong> ${details.address.district}</div>
                            <div><strong>State:</strong> ${details.address.state}</div>
                            <div><strong>PIN:</strong> ${details.address.pin}</div>
                            <div><strong>DIGIPIN:</strong> ${details.address.digipin}</div>
                        </div>
                    </div>
                    
                    ${details.result ? `
                        <div class="review-section">
                            <h3>Current Result</h3>
                            <div class="result-summary">
                                <div>ACS: <strong>${Math.round(details.result.acs)}</strong></div>
                                <div>VL: <strong>${details.result.vl}</strong></div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="review-section">
                        <h3>Evidence Signals</h3>
                        ${details.evidence.map(ev => `
                            <div class="evidence-mini">
                                <strong>${formatEvidenceType(ev.type)}:</strong> ${Math.round(ev.score)}/100
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="review-section">
                        <h3>Admin Actions</h3>
                        <div class="admin-actions-form">
                            <label style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 12px; cursor: pointer;">
                                <input type="checkbox" id="postmanConfirm_${requestId}" style="margin-top: 4px;" ${postmanSignal ? 'checked' : ''}>
                                <div>
                                    <strong>Postman Verification Received</strong>
                                    ${postmanSignal ?
                '<span style="background: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-left: 6px;">✅ LIVE SIGNAL RECEIVED</span>' : ''}
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Confirm that a Postman has physically verified this address</div>
                                </div>
                            </label>
                            
                            <label style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 12px; cursor: pointer;">
                                <input type="checkbox" id="deliveryConfirm_${requestId}" style="margin-top: 4px;" ${deliverySignal ? 'checked' : ''}>
                                <div>
                                    <strong>Delivery Agent Verification Received</strong>
                                    ${deliverySignal ?
                '<span style="background: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-left: 6px;">✅ LIVE SIGNAL RECEIVED</span>' : ''}
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Confirm that a Delivery Agent has successfully delivered here</div>
                                </div>
                            </label>
                            <br>
                            <label>
                                Override VL:
                                <select id="overrideVL_${requestId}">
                                    <option value="">-- No Override --</option>
                                    <option value="VL0">VL0</option>
                                    <option value="VL1">VL1</option>
                                    <option value="VL2">VL2</option>
                                    <option value="VL3">VL3</option>
                                </select>
                            </label>
                            <br>
                            <label>
                                Notes:
                                <textarea id="adminNotes_${requestId}" rows="3" style="width: 100%; margin-top: 8px; padding: 8px; border-radius: 8px; border: 1px solid var(--border);"></textarea>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="confirmAdminReview('${requestId}')">
                        ✅ Confirm & Update
                    </button>
                    <button class="btn btn-outline" onclick="this.closest('.modal').remove()">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

    } catch (error) {
        showNotification('Failed to load request details', 'error');
    }
}

async function confirmAdminReview(requestId) {
    const postmanConfirmed = document.getElementById(`postmanConfirm_${requestId}`).checked;
    const deliveryConfirmed = document.getElementById(`deliveryConfirm_${requestId}`).checked;
    const overrideVL = document.getElementById(`overrideVL_${requestId}`).value;
    const notes = document.getElementById(`adminNotes_${requestId}`).value;

    try {
        const payload = {
            request_id: requestId,
            admin_id: 'admin_001',
            postman_confirmed: postmanConfirmed,
            delivery_confirmed: deliveryConfirmed,
            mark_vl: overrideVL || null,
            notes: notes
        };

        const result = await apiRequest('/api/admin/confirm', 'POST', payload);

        showNotification(
            `Validation updated! ACS: ${Math.round(result.old_acs)} → ${Math.round(result.new_acs)}, VL: ${result.vl}`,
            'success'
        );

        // Close modal
        document.querySelectorAll('.modal').forEach(m => m.remove());

        // Refresh dashboard
        loadAdminDashboard();

    } catch (error) {
        showNotification('Failed to update validation', 'error');
    }
}

// Add CSS for admin dashboard
const adminStyles = document.createElement('style');
adminStyles.textContent = `
    .kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-xl);
    }
    
    .kpi-card {
        padding: var(--spacing-lg);
        border-radius: var(--radius-lg);
        text-align: center;
        transition: all var(--transition-base);
    }
    
    .kpi-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
    }
    
    .kpi-icon {
        font-size: 2.5rem;
        margin-bottom: var(--spacing-sm);
    }
    
    .kpi-value {
        font-size: 2.5rem;
        font-weight: 900;
        font-family: var(--font-display);
        background: var(--gradient-primary);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    .kpi-label {
        color: var(--text-secondary);
        font-size: 0.875rem;
        margin-top: var(--spacing-xs);
    }
    
    .queue-section {
        margin-top: var(--spacing-xl);
    }
    
    .queue-section h2 {
        margin-bottom: var(--spacing-md);
    }
    
    .queue-table {
        padding: var(--spacing-lg);
        border-radius: var(--radius-lg);
        overflow-x: auto;
    }
    
    .queue-table table {
        width: 100%;
        border-collapse: collapse;
    }
    
    .queue-table th {
        text-align: left;
        padding: var(--spacing-sm) var(--spacing-md);
        border-bottom: 2px solid var(--border);
        font-weight: 600;
        color: var(--text-secondary);
        font-size: 0.875rem;
    }
    
    .queue-table td {
        padding: var(--spacing-md);
        border-bottom: 1px solid var(--border-light);
    }
    
    .queue-table tr:hover {
        background: var(--surface-hover);
    }
    
    .request-id {
        font-family: monospace;
        font-size: 0.75rem;
        background: var(--surface);
        padding: 2px 6px;
        border-radius: 4px;
    }
    
    .address-cell {
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    
    .status-badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
    }
    
    .status-done {
        background: #d1fae5;
        color: #065f46;
    }
    
    .status-processing {
        background: #fef3c7;
        color: #92400e;
    }
    
    .status-queued {
        background: #dbeafe;
        color: #1e40af;
    }
    
    .vl-badge-sm {
        padding: 4px 8px;
        border-radius: 6px;
        color: white;
        font-size: 0.75rem;
        font-weight: 700;
    }
    
    .date-cell {
        font-size: 0.875rem;
        color: var(--text-muted);
        white-space: nowrap;
    }
    
    .review-section {
        margin-bottom: var(--spacing-lg);
        padding-bottom: var(--spacing-lg);
        border-bottom: 1px solid var(--border);
    }
    
    .review-section:last-child {
        border-bottom: none;
    }
    
    .detail-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-sm);
        margin-top: var(--spacing-sm);
    }
    
    .result-summary {
        display: flex;
        gap: var(--spacing-lg);
        margin-top: var(--spacing-sm);
        font-size: 1.125rem;
    }
    
    .evidence-mini {
        padding: var(--spacing-xs) var(--spacing-sm);
        background: var(--surface);
        border-radius: var(--radius-sm);
        margin-bottom: var(--spacing-xs);
    }
    
    .admin-actions-form label {
        display: block;
        margin-bottom: var(--spacing-sm);
    }
    
    .admin-actions-form select {
        margin-left: var(--spacing-sm);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-sm);
        border: 1px solid var(--border);
    }
`;
document.head.appendChild(adminStyles);
