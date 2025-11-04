// Background Service Worker
console.log('🚀 Background Service Worker started');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('✅ Extension installed');
  } else if (details.reason === 'update') {
    console.log('✅ Extension updated to version', chrome.runtime.getManifest().version);
  }
});

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Message received:', request);

  // Handle different message types
  switch (request.action) {
    case 'ping':
      sendResponse({ status: 'ok', message: 'Service worker is alive' });
      break;

    default:
      console.warn('Unknown action:', request.action);
      sendResponse({ status: 'error', message: 'Unknown action' });
  }

  return true; // Keep message channel open for async responses
});

// Keep service worker alive (if needed)
chrome.runtime.onConnect.addListener((port) => {
  console.log('🔌 Port connected:', port.name);

  port.onDisconnect.addListener(() => {
    console.log('🔌 Port disconnected:', port.name);
  });
});

console.log('✅ Background Service Worker ready');

