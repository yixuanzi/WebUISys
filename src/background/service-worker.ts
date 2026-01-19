/**
 * WebUISys Background Service Worker (Manifest V3)
 */

console.log('WebUISys service worker starting...');

// Extend ServiceWorkerGlobalScope interface
declare global {
  interface ServiceWorkerGlobalScope {
    skipWaiting(): void;
  }
}

/**
 * Install event - set up initial state
 */
self.addEventListener('install', () => {
  console.log('Service worker installing...');
  // @ts-ignore - skipWaiting exists on service worker
  self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event: Event) => {
  console.log('Service worker activating...');
  // @ts-ignore - waitUntil exists on service worker events
  event.waitUntil((self as any).clients.claim());
});

/**
 * Handle extension installation
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
    // Set default values
    chrome.storage.local.set({
      image_filter_options: {
        sizeMin: 4000,
        sizeMax: 0,
        unknownSizeAction: 'save',
        dimensionWidthMin: 200,
        dimensionWidthMax: 0,
        dimensionHeightMin: 200,
        dimensionHeightMax: 0,
        unknownDimensionAction: 'save',
        typeFilter: 'all',
        imageTypes: {
          jpeg: false,
          png: false,
          gif: false,
          bmp: false
        },
        noExtensionAction: 'jpg',
        useRegex: false,
        regexPattern: '',
        sameOriginOnly: false,
        deepSearchLevel: 1,
        openSaveDialog: false
      }
    });
  } else if (details.reason === 'update') {
    console.log('Extension updated');
  }
});

/**
 * Create context menu on startup
 */
chrome.runtime.onStartup.addListener(() => {
  createContextMenus();
});

/**
 * Handle messages from content scripts and popups
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Received message:', message.type);

  if (message.type === 'GET_TAB_URL') {
    // Get current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        sendResponse({ type: 'TAB_URL_RESPONSE', url: tabs[0].url });
      }
    });
    return true; // Keep message channel open for async response
  }

  if (message.type === 'FETCH_PAGE') {
    // Fetch page content - service worker can bypass CSP
    fetchPage(message.url)
      .then((content) => {
        sendResponse({ content });
      })
      .catch((error) => {
        sendResponse({ error: error.message });
      });
    return true; // Keep message channel open for async response
  }

  return false;
});

/**
 * Fetch page content
 * Service worker can make requests to any URL without CSP restrictions
 */
async function fetchPage(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Failed to fetch page:', error);
    throw error;
  }
}

/**
 * Handle context menu clicks
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'save-images' && tab?.id) {
    // Open image download UI
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/save-images/index.html')
    });
  }
});

/**
 * Create context menu items
 */
function createContextMenus(): void {
  chrome.contextMenus.create({
    id: 'save-images',
    title: '下载图片',
    contexts: ['page', 'image']
  });
}

// Initialize context menus
createContextMenus();

export {};
