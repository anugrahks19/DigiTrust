
// logic for fetching and rendering audit logs
// Assuming included in index.html or imported

async function loadPrivacyLedger() {
    const tableBody = document.getElementById('auditLogBody');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">Loading logs...</td></tr>';

    try {
        const token = localStorage.getItem('auth_token'); // Or however we store it
        if (!token) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">Please login to view logs.</td></tr>';
            return;
        }

        const response = await fetch('http://localhost:8000/api/audit/logs', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch logs');
        }

        const logs = await response.json();

        if (logs.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">No activity recorded yet.</td></tr>';
            return;
        }

        tableBody.innerHTML = logs.map(log => `
            <tr style="border-bottom: 1px solid var(--border-color-dim);">
                <td style="padding: 1rem;">${new Date(log.timestamp).toLocaleString()}</td>
                <td style="padding: 1rem;"><span class="badge" style="background: rgba(var(--primary-rgb), 0.1); color: var(--primary-color); padding: 0.25rem 0.5rem; border-radius: 4px;">${log.action}</span></td>
                <td style="padding: 1rem; font-family: monospace; font-size: 0.9em;">${JSON.stringify(log.details_json)}</td>
                <td style="padding: 1rem;">✅ Recorded</td>
            </tr>
        `).join('');

    } catch (e) {
        console.error(e);
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--error-color);">Error loading logs: ${e.message}</td></tr>`;
    }
}

// Export for app.js
window.loadPrivacyLedger = loadPrivacyLedger;
