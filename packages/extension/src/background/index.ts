// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('Recipe Planner extension installed');
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((_request, _sender, _sendResponse) => {
  // Handle any background tasks here
  return true;
});
