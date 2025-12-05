// ====================================
// Agent Dashboards View Component
// ====================================

// Static history data to simulate previous activity
const staticHistory = [
    {
        id: 'HIST-001',
        address: '12/B, Gandhi Road, Thrissur',
        status: 'DONE',
        type: 'delivery'
    },
    {
        id: 'HIST-002',
        address: 'Apt 4B, Skyline Apts, Kochi',
        status: 'DONE',
        type: 'delivery'
    }
];

async function loadAgentDashboards() {
    const postmanView = document.getElementById('postmanView');
    const deliveryView = document.getElementById('deliveryView');

    if (postmanView && postmanView.classList.contains('active')) {
        loadPostmanTasks();
    } else if (deliveryView && deliveryView.classList.contains('active')) {
        loadDeliveryTasks();
    }
}

async function loadPostmanTasks() {
    const container = document.getElementById('postmanTaskList');
    if (!container) return;

    container.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

    try {
        // Reuse admin queue API to get pending requests
        const data = await apiRequest('/api/admin/queue?limit=10');

        // Get manually added routes from localStorage
        const addedRoutes = JSON.parse(localStorage.getItem('added_routes_postman') || '[]');

        // Combine static history, added routes, and dynamic pending tasks
        let allTasks = [
            ...staticHistory.map(t => ({ ...t, isStatic: true })),
            ...addedRoutes.map(r => ({ ...r, isAdded: true })),
            ...(data.queue || []).filter(item => item.status !== 'DONE')
        ];

        if (allTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state glass">
                    <p>No routes for today</p>
                </div>
            `;
            return;
        }

        container.innerHTML = allTasks.map(item => {
            const isDone = item.status === 'DONE';
            const requestId = item.request_id || item.id;
            const address = item.address;

            return `
            <div class="task-item ${isDone ? 'task-done' : ''}" id="task_${requestId}">
                <div class="task-status ${isDone ? 'completed' : 'pending'}"></div>
                <div class="task-info">
                    <h4 style="${isDone ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">
                        ${requestId.startsWith('PKG') || requestId.startsWith('HIST') ? '#' + requestId : requestId}
                    </h4>
                    <p>${address}</p>
                </div>
                ${isDone ?
                    `<button class="btn btn-sm btn-outline" disabled>Completed</button>` :
                    `<button class="btn btn-sm btn-primary" 
                        onclick="markAsDelivered('postman', '${requestId}', '${address.replace(/'/g, "\\'")}')"
                        id="btn_postman_${requestId}">
                        Mark as Delivered
                    </button>`
                }
            </div>
        `}).join('');

        // Check for existing signals and update buttons for dynamic tasks
        const signals = JSON.parse(localStorage.getItem('agent_signals') || '{}');
        allTasks.forEach(item => {
            const requestId = item.request_id || item.id;
            if (!item.isStatic && signals[requestId] && signals[requestId].postman) {
                const btn = document.getElementById(`btn_postman_${requestId}`);
                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = 'Completed';
                    btn.classList.remove('btn-primary');
                    btn.classList.add('btn-outline');
                    // Also strike through the ID
                    const taskItem = document.getElementById(`task_${requestId}`);
                    if (taskItem) {
                        taskItem.classList.add('task-done');
                        taskItem.querySelector('h4').style.textDecoration = 'line-through';
                        taskItem.querySelector('h4').style.color = 'var(--text-muted)';
                        taskItem.querySelector('.task-status').classList.remove('pending');
                        taskItem.querySelector('.task-status').classList.add('completed');
                    }
                }
            }
        });

    } catch (error) {
        console.error('Failed to load postman tasks:', error);
        container.innerHTML = '<div class="error-state">Failed to load tasks</div>';
    }
}

async function loadDeliveryTasks() {
    const container = document.getElementById('deliveryTaskList');
    if (!container) return;

    container.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

    try {
        // Reuse admin queue API
        const data = await apiRequest('/api/admin/queue?limit=10');

        // Get manually added routes from localStorage
        const addedRoutes = JSON.parse(localStorage.getItem('added_routes_delivery') || '[]');

        // Combine static history, added routes, and dynamic pending tasks
        let allTasks = [
            ...staticHistory.map(t => ({ ...t, isStatic: true })),
            ...addedRoutes.map(r => ({ ...r, isAdded: true })),
            ...(data.queue || []).filter(item => item.status !== 'DONE')
        ];

        if (allTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state glass">
                    <p>No active deliveries</p>
                </div>
            `;
            return;
        }

        container.innerHTML = allTasks.map((item, idx) => {
            const isDone = item.status === 'DONE';
            const requestId = item.request_id || item.id;
            const address = item.address;
            const statusClass = isDone ? 'completed' : (idx === 0 ? 'active' : 'pending');

            return `
            <div class="task-item ${isDone ? 'task-done' : ''}" id="task_${requestId}">
                <div class="task-status ${statusClass}"></div>
                <div class="task-info">
                    <h4 style="${isDone ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">
                        ${requestId.startsWith('PKG') || requestId.startsWith('HIST') ? '#' + requestId : '#PKG-' + requestId.substring(0, 4).toUpperCase()}
                    </h4>
                    <p>${address.split(',')[0]}</p>
                </div>
                ${isDone ?
                    `<button class="btn btn-sm btn-outline" disabled>Completed</button>` :
                    `<button class="btn btn-sm btn-primary" 
                        onclick="markAsDelivered('delivery', '${requestId}', '${address.split(',')[0].replace(/'/g, "\\'")}')"
                        id="btn_delivery_${requestId}">
                        Mark as Delivered
                    </button>`
                }
            </div>
        `}).join('');

        // Check for existing signals
        const signals = JSON.parse(localStorage.getItem('agent_signals') || '{}');
        allTasks.forEach(item => {
            const requestId = item.request_id || item.id;
            if (!item.isStatic && signals[requestId] && signals[requestId].delivery) {
                const btn = document.getElementById(`btn_delivery_${requestId}`);
                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = 'Completed';
                    btn.classList.remove('btn-primary');
                    btn.classList.add('btn-outline');
                    // Also strike through the ID
                    const taskItem = document.getElementById(`task_${requestId}`);
                    if (taskItem) {
                        taskItem.classList.add('task-done');
                        taskItem.querySelector('h4').style.textDecoration = 'line-through';
                        taskItem.querySelector('h4').style.color = 'var(--text-muted)';
                        taskItem.querySelector('.task-status').classList.remove('active');
                        taskItem.querySelector('.task-status').classList.add('completed');
                    }
                }
            }
        });

    } catch (error) {
        console.error('Failed to load delivery tasks:', error);
        container.innerHTML = '<div class="error-state">Failed to load deliveries</div>';
    }
}

// Global variable to track current agent type for modal
let currentAgentType = '';

function addExtraRoute(type) {
    currentAgentType = type;
    const modal = document.getElementById('addRouteModal');
    const input = document.getElementById('routeAddressInput');

    // Show modal
    modal.style.display = 'flex';
    input.value = '';
    input.focus();

    // Handle Enter key
    input.onkeypress = function (e) {
        if (e.key === 'Enter') {
            submitAddRoute();
        }
    };
}

function closeAddRouteModal() {
    const modal = document.getElementById('addRouteModal');
    modal.style.display = 'none';
    currentAgentType = '';
}

function submitAddRoute() {
    const input = document.getElementById('routeAddressInput');
    const address = input.value.trim();

    if (!address) {
        showNotification('Please enter an address', 'error');
        return;
    }

    // Create a new route object
    const newId = 'EXTRA-' + Date.now().toString().slice(-4);
    const newRoute = {
        id: newId,
        request_id: newId,
        address: address,
        status: 'PENDING'
    };

    // Get existing routes from localStorage
    const storageKey = currentAgentType === 'postman' ? 'added_routes_postman' : 'added_routes_delivery';
    const existingRoutes = JSON.parse(localStorage.getItem(storageKey) || '[]');

    // Add new route
    existingRoutes.push(newRoute);
    localStorage.setItem(storageKey, JSON.stringify(existingRoutes));

    // Reload the task list to show the new route
    if (currentAgentType === 'postman') {
        loadPostmanTasks();
    } else {
        loadDeliveryTasks();
    }

    showNotification('New route added successfully', 'success');
    closeAddRouteModal();
}

// Mark delivery as completed and validate address
async function markAsDelivered(agentType, requestId, address) {
    const confirmDelivery = confirm(`Confirm delivery for:\n${address}\n\nThis will mark the address as validated.`);

    if (!confirmDelivery) return;

    try {
        // Update button to show loading
        const btnId = `btn_${agentType}_${requestId}`;
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '⏳ Confirming...';
        }

        // Store delivery signal in localStorage
        const signals = JSON.parse(localStorage.getItem('agent_signals') || '{}');
        if (!signals[requestId]) {
            signals[requestId] = {};
        }
        signals[requestId][agentType] = {
            timestamp: new Date().toISOString(),
            address: address,
            agent: agentType.toUpperCase() + '-01'
        };
        localStorage.setItem('agent_signals', JSON.stringify(signals));

        // Update UI to mark as completed
        const taskItem = document.getElementById(`task_${requestId}`);
        if (taskItem) {
            taskItem.classList.add('task-done');
            const h4 = taskItem.querySelector('h4');
            if (h4) {
                h4.style.textDecoration = 'line-through';
                h4.style.color = 'var(--text-muted)';
            }
            const status = taskItem.querySelector('.task-status');
            if (status) {
                status.classList.remove('pending', 'active');
                status.classList.add('completed');
            }
        }

        // Update button to completed status
        if (btn) {
            btn.innerHTML = '✓ Completed';
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-outline');
        }

        showNotification(`✓ Delivery confirmed and address validated for ${address}`, 'success');
    } catch (error) {
        console.error('Failed to mark as delivered:', error);
        showNotification('Failed to confirm delivery', 'error');

        // Reset button on error
        const btn = document.getElementById(`btn_${agentType}_${requestId}`);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Mark as Delivered';
        }
    }
}
