// Logic for Developer API Sandbox

async function loadDeveloperKey() {
    const keyDisplay = document.getElementById('apiKeyDisplay');
    const generateBtn = document.getElementById('generateKeyBtn');

    // Ensure button listener is attached (idempotent)
    if (generateBtn) {
        generateBtn.onclick = generateNewKey; // Direct assignment to ensure no duplicates
    }

    try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            keyDisplay.value = "Please login to manage API keys";
            if (generateBtn) generateBtn.disabled = true;
            return;
        }

        const data = await apiRequest('/api/developers/my-key');

        if (data && data.key) {
            keyDisplay.value = data.key;
            updateQuickStartExample(data.key);
        } else {
            keyDisplay.value = "No active key. Generate one now!";
            updateQuickStartExample("YOUR_API_KEY");
        }

    } catch (e) {
        console.error("Error loading key:", e);
        keyDisplay.value = "Error loading key. Check console.";
    }
}

async function generateNewKey() {
    const keyDisplay = document.getElementById('apiKeyDisplay');
    const generateBtn = document.getElementById('generateKeyBtn');

    if (!confirm("Are you sure? This will invalidate your previous API key.")) {
        return;
    }

    try {
        generateBtn.disabled = true;
        generateBtn.textContent = "Generating...";

        const data = await apiRequest('/api/developers/generate-key', {
            method: 'POST'
        });

        if (data && data.key) {
            keyDisplay.value = data.key;
            updateQuickStartExample(data.key);
            alert("New API Key generated successfully!");
        } else {
            throw new Error("Invalid response");
        }
    } catch (e) {
        console.error(e);
        alert("Error generating key: " + e.message);
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = "Generate New Key";
    }
}

function updateQuickStartExample(key) {
    const codeBlock = document.querySelector('#developersView code');
    if (codeBlock) {
        codeBlock.innerHTML = `curl -X POST "http://localhost:8000/api/validate" \\
     -H "Authorization: Bearer <span style="color: #4ade80; font-weight: bold;">${key}</span>" \\
     -H "Content-Type: application/json" \\
     -d '{
           "address": "123 Main St, Bangalore",
           "user_id": "customer_001"
         }'`;
    }
}

// Export for app.js
window.loadDeveloperKey = loadDeveloperKey;
window.generateNewKey = generateNewKey;
