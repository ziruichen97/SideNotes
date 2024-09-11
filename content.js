console.log('Content script loaded');

// Function to inject custom styles into the page
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* CSS styles for the notes overlay */
    .web-page-saver-notes {
      position: fixed;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      width: 300px;
      height: 400px;
      font-family: Arial, sans-serif;
      background-color: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      border-radius: 4px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
    }
    .web-page-saver-header {
      background-color: #4CAF50;
      color: white;
      padding: 3px;
      cursor: move;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
    }
    .web-page-saver-header button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      margin-right: 10px;
      color: white;
    }
    .web-page-saver-body {
      flex-grow: 1;
      overflow-y: auto;
      border: 1px solid #ccc;
      border-top: none;
      border-bottom-left-radius: 4px;
      border-bottom-right-radius: 4px;
      padding: 10px;
    }
    .web-page-saver-content {
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
    }
    .web-page-saver-notes-content * {
      max-width: 100%;
    }
    .web-page-saver-notes-content ul,
    .web-page-saver-notes-content ol {
      margin-left: 0;
      padding-left: 20px;
      list-style-position: outside;
    }
    .web-page-saver-notes-content ul {
      list-style-type: disc !important;
    }
    .web-page-saver-notes-content ol {
      list-style-type: decimal !important;
    }
    .web-page-saver-notes-content li {
      display: list-item !important;
      margin-bottom: 5px;
    }
    .web-page-saver-notes-content ul li {
      list-style-type: disc !important;
    }
    .web-page-saver-notes-content ol li {
      list-style-type: decimal !important;
    }
    .web-page-saver-notes-content a {
      color: #0000EE;
      text-decoration: underline;
    }
    .web-page-saver-notes-content strong,
    .web-page-saver-notes-content b {
      font-weight: bold;
    }
    .web-page-saver-notes-content em,
    .web-page-saver-notes-content i {
      font-style: italic;
    }
    .web-page-saver-notes-content u {
      text-decoration: underline;
    }
    .web-page-saver-notes.dark-mode {
      background-color: #333;
      color: #fff;
    }
    .web-page-saver-notes.dark-mode .web-page-saver-header {
      background-color: #222;
    }
    .web-page-saver-notes.dark-mode .web-page-saver-body {
      border-color: #666;
      background-color: #444;
    }
    .web-page-saver-notes.dark-mode .web-page-saver-notes-content a {
      color: #8BC34A;
    }
    .web-page-saver-resize-handle {
      position: absolute;
      background-color: transparent;
      z-index: 10000;
    }
    .web-page-saver-resize-handle.top-left,
    .web-page-saver-resize-handle.top-right,
    .web-page-saver-resize-handle.bottom-left,
    .web-page-saver-resize-handle.bottom-right {
      width: 10px;
      height: 10px;
    }
    .web-page-saver-resize-handle.top,
    .web-page-saver-resize-handle.bottom {
      height: 5px;
      left: 0;
      right: 0;
    }
    .web-page-saver-resize-handle.left,
    .web-page-saver-resize-handle.right {
      width: 5px;
      top: 0;
      bottom: 0;
    }
    .web-page-saver-resize-handle.top-left { top: -5px; left: -5px; cursor: nwse-resize; }
    .web-page-saver-resize-handle.top-right { top: -5px; right: -5px; cursor: nesw-resize; }
    .web-page-saver-resize-handle.bottom-left { bottom: -5px; left: -5px; cursor: nesw-resize; }
    .web-page-saver-resize-handle.bottom-right { bottom: -5px; right: -5px; cursor: nwse-resize; }
    .web-page-saver-resize-handle.top { top: -5px; cursor: ns-resize; }
    .web-page-saver-resize-handle.right { right: -5px; cursor: ew-resize; }
    .web-page-saver-resize-handle.bottom { bottom: -5px; cursor: ns-resize; }
    .web-page-saver-resize-handle.left { left: -5px; cursor: ew-resize; }
    .web-page-saver-resize-handle:hover { background-color: rgba(69, 160, 73, 0.2); }

    .web-page-saver-notes-wrapper {
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
    }
  `;
  document.head.appendChild(style);
}

// Function to inject Font Awesome styles
function injectFontAwesome() {
  const link = document.createElement('link');
  link.href = chrome.runtime.getURL('fontawesome-free-6.6.0-web/css/all.css');
  link.type = 'text/css';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

// Inject custom styles and Font Awesome
injectStyles();
injectFontAwesome();

// Function to update the notes display
function updateNotesDisplay(linkData) {
  console.log('Link data received:', linkData);
  let notesElement = document.querySelector('.web-page-saver-notes');
  if (!notesElement) {
    notesElement = document.createElement('div');
    notesElement.className = 'web-page-saver-notes';
    document.body.appendChild(notesElement);
    console.log('Notes element appended to body');
  }
  
  notesElement.innerHTML = `
    <div class="web-page-saver-header">
      <div>
        <button class="web-page-saver-dark-mode" title="Toggle Dark Mode">
          <i class="fas fa-moon"></i>
        </button>
        <button class="web-page-saver-edit" title="Edit Notes">
          <i class="fas fa-edit"></i>
        </button>
        <button class="web-page-saver-toggle" title="Toggle Notes">
          <i class="fas fa-minus"></i>
        </button>
      </div>
    </div>
    <div class="web-page-saver-body">
      <div class="web-page-saver-content">
        <div class="web-page-saver-notes-content"></div>
      </div>
      <div class="web-page-saver-resize-handle top-left"></div>
      <div class="web-page-saver-resize-handle top-right"></div>
      <div class="web-page-saver-resize-handle bottom-left"></div>
      <div class="web-page-saver-resize-handle bottom-right"></div>
      <div class="web-page-saver-resize-handle top"></div>
      <div class="web-page-saver-resize-handle right"></div>
      <div class="web-page-saver-resize-handle bottom"></div>
      <div class="web-page-saver-resize-handle left"></div>
    </div>
  `;

  const notesContent = notesElement.querySelector('.web-page-saver-notes-content');
  setInnerHTML(notesContent, linkData.notes);
  console.log('Notes content set:', notesContent.innerHTML);

  const toggleButton = notesElement.querySelector('.web-page-saver-toggle');
  const editButton = notesElement.querySelector('.web-page-saver-edit');
  const darkModeButton = notesElement.querySelector('.web-page-saver-dark-mode');
  const body = notesElement.querySelector('.web-page-saver-body');
  const header = notesElement.querySelector('.web-page-saver-header');

  let originalWidth, originalHeight, originalLeft, originalBottom;

  toggleButton.addEventListener('click', function() {
    if (body.style.display === 'none') {
      // Expanding
      body.style.display = 'block';
      notesElement.style.width = originalWidth;
      notesElement.style.height = originalHeight;
      notesElement.style.left = originalLeft;
      notesElement.style.bottom = originalBottom;
      header.style.width = originalWidth;
      toggleButton.innerHTML = '<i class="fas fa-minus"></i>';
    } else {
      // Shrinking
      originalWidth = notesElement.style.width;
      originalHeight = notesElement.style.height;
      originalLeft = notesElement.style.left;
      originalBottom = notesElement.style.bottom;
      
      const rect = notesElement.getBoundingClientRect();
      const newLeft = rect.right - 100 + 'px';
      const newBottom = rect.top + 'px';
      
      body.style.display = 'none';
      notesElement.style.width = '100px';
      notesElement.style.height = '20px';
      notesElement.style.left = newLeft;
      notesElement.style.bottom = newBottom;
      header.style.width = '100px';
      toggleButton.innerHTML = '<i class="fas fa-plus"></i>';
    }
  });

  editButton.addEventListener('click', function() {
    chrome.runtime.sendMessage({action: "openPopup", url: window.location.href});
  });

  darkModeButton.addEventListener('click', function() {
    const isDarkMode = notesElement.classList.toggle('dark-mode');
    updateDarkModeIcon(darkModeButton, isDarkMode);
    // Save the dark mode preference and update the popup
    chrome.storage.local.set({notesDarkMode: isDarkMode}, function() {
      // Send message to background script to update popup
      chrome.runtime.sendMessage({action: "updatePopupDarkMode", isDarkMode: isDarkMode});
    });
  });

  makeDraggable(notesElement);
  makeResizable(notesElement);
  loadSavedSize(notesElement);

  // Check and apply saved dark mode preference
  chrome.storage.local.get('notesDarkMode', function(result) {
    if (result.notesDarkMode) {
      notesElement.classList.add('dark-mode');
      updateDarkModeIcon(darkModeButton, true);
    }
  });

  console.log('Notes display updated');
}

// Function to update the dark mode icon
function updateDarkModeIcon(button, isDarkMode) {
  button.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// Function to make the notes overlay draggable
function makeDraggable(element) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  element.querySelector('.web-page-saver-header').addEventListener('mousedown', dragMouseDown, { passive: true });

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.addEventListener('mouseup', closeDragElement, { passive: true });
    document.addEventListener('mousemove', elementDrag, { passive: true });
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";;
  }

  function closeDragElement() {
    document.removeEventListener('mouseup', closeDragElement, { passive: true });
    document.removeEventListener('mousemove', elementDrag, { passive: true });
  }
}

// Function to make the notes overlay resizable
function makeResizable(element) {
  const resizeHandles = element.querySelectorAll('.web-page-saver-resize-handle');
  const body = element.querySelector('.web-page-saver-body');
  const header = element.querySelector('.web-page-saver-header');
  let isResizing = false;
  let currentHandle = null;
  let startX, startY, startWidth, startHeight, startLeft, startTop;

  resizeHandles.forEach(handle => {
    handle.addEventListener('mousedown', initResize);
  });

  function initResize(e) {
    isResizing = true;
    currentHandle = e.target;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
    startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);
    startLeft = element.offsetLeft;
    startTop = element.offsetTop;
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
    e.preventDefault();
  }

  function resize(e) {
    if (!isResizing) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    if (currentHandle.classList.contains('right') || currentHandle.classList.contains('bottom-right') || currentHandle.classList.contains('top-right')) {
      const newWidth = startWidth + dx;
      if (newWidth > 200) {
        element.style.width = newWidth + 'px';
        header.style.width = (newWidth - 5) + 'px'; // Subtract 5px for the resize handle
      }
    }
    if (currentHandle.classList.contains('bottom') || currentHandle.classList.contains('bottom-right') || currentHandle.classList.contains('bottom-left')) {
      const newHeight = startHeight + dy;
      if (newHeight > 100) element.style.height = newHeight + 'px';
    }
    if (currentHandle.classList.contains('left') || currentHandle.classList.contains('top-left') || currentHandle.classList.contains('bottom-left')) {
      const newWidth = startWidth - dx;
      if (newWidth > 200) {
        element.style.width = newWidth + 'px';
        header.style.width = (newWidth - 5) + 'px'; // Subtract 5px for the resize handle
        element.style.left = startLeft + dx + 'px';
      }
    }
    if (currentHandle.classList.contains('top') || currentHandle.classList.contains('top-left') || currentHandle.classList.contains('top-right')) {
      const newHeight = startHeight - dy;
      if (newHeight > 100) {
        element.style.height = newHeight + 'px';
        element.style.top = startTop + dy + 'px';
      }
    }
    
    // Adjust body height
    const headerHeight = header.offsetHeight;
    body.style.height = (element.offsetHeight - headerHeight) + 'px';
  }

  function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
    saveSize(element);
  }
}

// Function to save the size of the notes overlay
function saveSize(element) {
  const size = {
    width: element.offsetWidth,
    height: element.offsetHeight
  };
  chrome.storage.local.set({ notesOverlaySize: size });
}

// Function to load the saved size of the notes overlay
function loadSavedSize(element) {
  chrome.storage.local.get('notesOverlaySize', (result) => {
    if (result.notesOverlaySize) {
      element.style.width = `${result.notesOverlaySize.width}px`;
      element.style.height = `${result.notesOverlaySize.height}px`;
      
      // Adjust body height and header width
      const body = element.querySelector('.web-page-saver-body');
      const header = element.querySelector('.web-page-saver-header');
      const headerHeight = header.offsetHeight;
      body.style.height = (result.notesOverlaySize.height - headerHeight) + 'px';
      header.style.width = `${result.notesOverlaySize.width - 5}px`; // Subtract 5px for the resize handle
    }
  });
}

// Function to check for saved notes and display them
function checkForSavedNotes() {
  console.log('Checking for saved notes');
  chrome.storage.local.get(['savedLinks', 'notesDarkMode'], function(result) {
    console.log('Saved links:', result.savedLinks);
    const savedLinks = result.savedLinks || [];
    const currentUrl = window.location.href;
    const savedLink = savedLinks.find(link => link.url === currentUrl);

    if (savedLink) {
      console.log('Found saved link for current URL:', savedLink);
      updateNotesDisplay(savedLink);
      
      // Apply dark mode if it's enabled
      if (result.notesDarkMode) {
        updateDarkMode(true);
      }
    } else {
      console.log('No saved link found for current URL');
    }
  });
}

// Function to update dark mode
function updateDarkMode(isDarkMode) {
  const notesElement = document.querySelector('.web-page-saver-notes');
  if (notesElement) {
    if (isDarkMode) {
      notesElement.classList.add('dark-mode');
    } else {
      notesElement.classList.remove('dark-mode');
    }
    const darkModeButton = notesElement.querySelector('.web-page-saver-dark-mode');
    updateDarkModeIcon(darkModeButton, isDarkMode);
  }
}

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in content script:', request);
  if (request.action === "updateNotes") {
    updateNotesDisplay(request.linkData);
  } else if (request.action === "toggleNotesVisibility") {
    const notesElement = document.querySelector('.web-page-saver-notes');
    if (notesElement) {
      notesElement.style.display = notesElement.style.display === 'none' ? 'block' : 'none';
    }
  } else if (request.action === "updateDarkMode") {
    updateDarkMode(request.isDarkMode);
  }
});

// Check for saved notes when the content script is first injected
checkForSavedNotes();

// Also check for saved notes when the page loads (for single-page applications)
window.addEventListener('load', checkForSavedNotes, { passive: true });

function setInnerHTML(element, html) {
  // Wrap the content in a div with a specific class
  element.innerHTML = `<div class="web-page-saver-notes-wrapper">${html}</div>`;
  console.log('Inner HTML set:', element.innerHTML);

  // Handle scripts if necessary
  Array.from(element.querySelectorAll("script")).forEach(oldScript => {
    const newScript = document.createElement("script");
    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
    newScript.appendChild(document.createTextNode(oldScript.innerHTML));
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });
}