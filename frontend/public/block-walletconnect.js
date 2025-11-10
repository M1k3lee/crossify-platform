// Block WalletConnect API calls when project ID is invalid
// This prevents 400/403 errors and unwanted redirects to MetaMask store
// This script must run BEFORE any other scripts to intercept API calls early
(function() {
  'use strict';
  
  const invalidProjectId = '0000000000000000000000000000000000000000';
  const walletConnectUrls = ['api.web3modal.org', 'pulse.walletconnect.org', 'relay.walletconnect.com'];
  const metamaskStoreUrl = 'chromewebstore.google.com';
  
  // Block any redirects to MetaMask store
  const originalWindowOpen = window.open;
  window.open = function(url, ...args) {
    if (typeof url === 'string' && url.includes(metamaskStoreUrl)) {
      console.warn('🚫 Blocked redirect to MetaMask store:', url);
      console.warn('   MetaMask should be installed manually by the user if needed.');
      return null; // Prevent the redirect
    }
    return originalWindowOpen.apply(this, [url, ...args]);
  };
  
  // Intercept fetch requests to WalletConnect API
  if (typeof window.fetch !== 'undefined') {
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0];
      if (typeof url === 'string') {
        // Check if it's a WalletConnect/Reown API call
        const isWalletConnectUrl = walletConnectUrls.some(wcUrl => url.includes(wcUrl));
        if (isWalletConnectUrl) {
          // Check if it's trying to use an invalid project ID
          if (url.includes(invalidProjectId)) {
            console.warn('🚫 Blocked WalletConnect/Reown API call with invalid project ID:', url);
            // Return a rejected promise silently to prevent errors
            return Promise.reject(new Error('WalletConnect disabled - using injected provider only'));
          }
        }
      }
      return originalFetch.apply(this, args);
    };
  }
  
  // Intercept XMLHttpRequest to WalletConnect API
  if (typeof XMLHttpRequest !== 'undefined') {
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      if (typeof url === 'string') {
        const isWalletConnectUrl = walletConnectUrls.some(wcUrl => url.includes(wcUrl));
        if (isWalletConnectUrl && url.includes(invalidProjectId)) {
          console.warn('🚫 Blocked WalletConnect/Reown XHR request with invalid project ID:', url);
          // Return early without opening the request
          return;
        }
      }
      return originalOpen.apply(this, [method, url, ...rest]);
    };
  }
  
  // Prevent navigation to MetaMask store
  document.addEventListener('click', function(e) {
    const target = e.target;
    if (target && target.href && typeof target.href === 'string' && target.href.includes(metamaskStoreUrl)) {
      e.preventDefault();
      e.stopPropagation();
      console.warn('🚫 Prevented navigation to MetaMask store');
      return false;
    }
  }, true); // Use capture phase to catch early
  
  console.log('✅ WalletConnect API blocker and redirect prevention initialized');
})();

