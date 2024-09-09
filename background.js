console.log('Background script loaded');

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background script:', request);
  if (request.action === "injectFontAwesome") {
    // Inject Font Awesome CSS into the current tab
    chrome.scripting.insertCSS({
      target: { tabId: sender.tab.id },
      files: ["fontawesome-free-6.6.0-web/css/all.css"]
    });
  } else if (request.action === "openPopup") {
    // Open the popup and send a message to open the edit form
    chrome.action.openPopup();
    setTimeout(() => {
      chrome.runtime.sendMessage({action: "openEditForm", url: request.url});
    }, 100);
  } else if (request.action === "updatePopupDarkMode") {
    // Broadcast the dark mode change to all open popups
    chrome.runtime.sendMessage({action: "updateDarkMode", isDarkMode: request.isDarkMode});
  }
});