console.log('Background script loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background script:', request);
  if (request.action === "injectFontAwesome") {
    chrome.scripting.insertCSS({
      target: { tabId: sender.tab.id },
      files: ["fontawesome-free-6.6.0-web/css/all.css"]
    });
  } else if (request.action === "openPopup") {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.action.openPopup();
      setTimeout(() => {
        chrome.runtime.sendMessage({action: "openEditForm", url: request.url});
      }, 100);
    });
  }
});