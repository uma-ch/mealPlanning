"use strict";
// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        // Update active tab
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        // Update active content
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`${tabName}-tab`)?.classList.add('active');
    });
});
// Elements
const recipeForm = document.getElementById('recipeForm');
const extractingDiv = document.getElementById('extracting');
const saveButton = document.getElementById('saveButton');
const refreshButton = document.getElementById('refreshButton');
const statusDiv = document.getElementById('status');
const titleInput = document.getElementById('title');
const ingredientsInput = document.getElementById('ingredients');
const instructionsInput = document.getElementById('instructions');
const imageUrlInput = document.getElementById('imageUrl');
const sourceUrlInput = document.getElementById('sourceUrl');
const environmentSelect = document.getElementById('environment');
const apiKeyInput = document.getElementById('apiKey');
const saveSettingsButton = document.getElementById('saveSettings');
const testConnectionButton = document.getElementById('testConnection');
const settingsStatusDiv = document.getElementById('settingsStatus');
const apiKeyStatusDiv = document.getElementById('apiKeyStatus');
let currentUrl = '';
let extractedData = null;
// Utility functions
function showStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
}
function showSettingsStatus(message, type = 'info') {
    settingsStatusDiv.textContent = message;
    settingsStatusDiv.className = `status ${type}`;
}
async function getSettings() {
    const result = await chrome.storage.local.get(['apiKey', 'environment']);
    return {
        apiKey: result.apiKey || '',
        environment: result.environment || 'http://localhost:5001',
    };
}
function getApiUrl(environment) {
    if (environment === 'production') {
        // TODO: Replace with actual production URL
        return 'https://your-app.onrender.com';
    }
    return environment;
}
// Load settings
async function loadSettings() {
    const settings = await getSettings();
    apiKeyInput.value = settings.apiKey;
    environmentSelect.value = settings.environment;
    updateApiKeyStatus(settings.apiKey);
}
function updateApiKeyStatus(apiKey) {
    if (apiKey) {
        apiKeyStatusDiv.textContent = `API Key configured: ${apiKey.substring(0, 12)}...`;
        apiKeyStatusDiv.className = 'api-key-status configured';
    }
    else {
        apiKeyStatusDiv.textContent = 'No API key configured';
        apiKeyStatusDiv.className = 'api-key-status not-configured';
    }
    apiKeyStatusDiv.style.display = 'block';
}
// Extract recipe from current tab
async function extractRecipe() {
    try {
        extractingDiv.style.display = 'block';
        recipeForm.style.display = 'none';
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.id || !tab.url) {
            throw new Error('No active tab found');
        }
        currentUrl = tab.url;
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });
        if (!response.success) {
            throw new Error('Failed to extract recipe data');
        }
        extractedData = response.data;
        // Populate form
        titleInput.value = extractedData.title || '';
        ingredientsInput.value = extractedData.ingredients || '';
        instructionsInput.value = extractedData.instructions || '';
        imageUrlInput.value = extractedData.imageUrl || '';
        sourceUrlInput.value = currentUrl;
        extractingDiv.style.display = 'none';
        recipeForm.style.display = 'block';
        if (extractedData.source === 'fallback') {
            showStatus('Could not auto-extract recipe. Please fill in the details below.', 'info');
        }
        else {
            showStatus('Recipe extracted! Review and edit if needed.', 'success');
        }
    }
    catch (error) {
        console.error('Error extracting recipe:', error);
        extractingDiv.style.display = 'none';
        showStatus(error instanceof Error ? error.message : 'Failed to extract recipe', 'error');
    }
}
// Save recipe
recipeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const settings = await getSettings();
    if (!settings.apiKey) {
        showStatus('Please configure your API key in Settings', 'error');
        return;
    }
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
    try {
        const apiUrl = getApiUrl(settings.environment);
        const recipeData = {
            url: sourceUrlInput.value,
            title: titleInput.value,
            ingredients: ingredientsInput.value,
            instructions: instructionsInput.value,
            imageUrl: imageUrlInput.value || undefined,
            rawHtml: extractedData?.rawHtml,
            source: extractedData?.source || 'fallback',
        };
        const response = await fetch(`${apiUrl}/api/extension/recipes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.apiKey}`,
            },
            body: JSON.stringify(recipeData),
        });
        const data = await response.json();
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Invalid API key. Please check your settings.');
            }
            if (response.status === 409) {
                throw new Error(`Recipe already exists: ${data.recipeTitle}`);
            }
            throw new Error(data.error || 'Failed to save recipe');
        }
        showStatus('Recipe saved successfully! View it in the app.', 'success');
        // Reset form after 2 seconds
        setTimeout(() => {
            recipeForm.reset();
            recipeForm.style.display = 'none';
            extractRecipe(); // Extract again for next save
        }, 2000);
    }
    catch (error) {
        console.error('Error saving recipe:', error);
        showStatus(error instanceof Error ? error.message : 'Failed to save recipe', 'error');
    }
    finally {
        saveButton.disabled = false;
        saveButton.textContent = 'Save Recipe';
    }
});
// Re-extract recipe
refreshButton.addEventListener('click', extractRecipe);
// Save settings
saveSettingsButton.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const environment = environmentSelect.value;
    if (!apiKey) {
        showSettingsStatus('Please enter an API key', 'error');
        return;
    }
    // Basic format validation
    if (!apiKey.startsWith('rp_')) {
        showSettingsStatus('Invalid API key format. Should start with rp_', 'error');
        return;
    }
    await chrome.storage.local.set({ apiKey, environment });
    updateApiKeyStatus(apiKey);
    showSettingsStatus('Settings saved successfully!', 'success');
    setTimeout(() => {
        settingsStatusDiv.style.display = 'none';
    }, 3000);
});
// Test connection
testConnectionButton.addEventListener('click', async () => {
    const settings = await getSettings();
    if (!settings.apiKey) {
        showSettingsStatus('Please save your API key first', 'error');
        return;
    }
    testConnectionButton.disabled = true;
    testConnectionButton.textContent = 'Testing...';
    try {
        const apiUrl = getApiUrl(settings.environment);
        // Try to fetch recipes list as a test
        const response = await fetch(`${apiUrl}/api/recipes`, {
            headers: {
                'Authorization': `Bearer ${settings.apiKey}`,
            },
        });
        if (response.ok) {
            showSettingsStatus('Connection successful!', 'success');
        }
        else if (response.status === 401) {
            showSettingsStatus('Invalid API key', 'error');
        }
        else {
            showSettingsStatus(`Connection failed: ${response.status}`, 'error');
        }
    }
    catch (error) {
        console.error('Connection test failed:', error);
        showSettingsStatus('Connection failed. Check your environment setting.', 'error');
    }
    finally {
        testConnectionButton.disabled = false;
        testConnectionButton.textContent = 'Test Connection';
    }
});
// Initialize
loadSettings();
extractRecipe();
