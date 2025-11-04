// Content Script - Runs on Personio pages
console.log('🌐 Personio Attendance Recorder content script loaded');

// Check if we're on a Personio page
if (window.location.hostname.includes('personio.com')) {
  console.log('✅ Running on Personio domain:', window.location.hostname);

  // IMPORTANT: Listen for messages FROM the extension (popup/background)
  // Using chrome.runtime.onMessage works for messages sent via chrome.tabs.sendMessage
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Content script received message:', request.action);

    if (request.action === 'makeApiRequest') {
      console.log('🌐 Content script: Making API request', request.method, request.url);

      // Make the request in the page context (has access to all cookies!)
      makeApiRequest(request.url, request.method, request.body, request.headers)
        .then(response => {
          console.log('✅ Content script: Request successful');
          sendResponse({ success: true, data: response });
        })
        .catch(error => {
          console.error('❌ Content script: Request failed', error);
          sendResponse({ success: false, error: error.message });
        });

      return true; // CRITICAL: Keep channel open for async response
    }

    // Handle other message types
    return false;
  });

  console.log('✅ Content script message listener registered');
}

/**
 * Make API request using fetch in page context
 * This has access to all cookies without restrictions!
 */
async function makeApiRequest(url, method, body, headers) {
  console.log(`🔧 Making ${method} request to:`, url);
  console.log('🔧 Headers:', headers);

  const options = {
    method: method,
    headers: headers,
    credentials: 'include' // Include all cookies
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
    console.log('🔧 Body:', JSON.stringify(body).substring(0, 200) + '...');
  }

  console.log('🚀 Sending request...');
  const response = await fetch(url, options);

  console.log(`📡 Response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Response error: ${response.status}`, errorText);
    throw new Error(`HTTP ${response.status}: ${errorText || 'No error message'}`);
  }

  const data = await response.json();
  console.log('✅ Response data received');
  return data;
}

