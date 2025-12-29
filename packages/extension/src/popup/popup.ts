const saveButton = document.getElementById('saveButton') as HTMLButtonElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;

function showStatus(message: string, isError = false) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${isError ? 'error' : 'success'}`;
  statusDiv.style.display = 'block';
}

saveButton.addEventListener('click', async () => {
  saveButton.disabled = true;
  saveButton.textContent = 'Saving...';

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) throw new Error('No active tab');

    // Extract recipe data from page
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });

    if (!response.success) {
      throw new Error('Failed to extract recipe data');
    }

    // Get auth token from storage
    const { authToken } = await chrome.storage.local.get('authToken');
    if (!authToken) {
      showStatus('Please log in to the Recipe Planner app first', true);
      return;
    }

    // Send to backend
    const apiUrl = 'http://localhost:5001/api/extension/recipes';
    const result = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        url: tab.url,
        ...response.data,
      }),
    });

    if (!result.ok) {
      throw new Error('Failed to save recipe');
    }

    showStatus('Recipe saved! Review it in the app.');
  } catch (error) {
    showStatus(error instanceof Error ? error.message : 'Failed to save recipe', true);
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = 'Save Recipe';
  }
});
