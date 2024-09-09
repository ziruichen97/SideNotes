console.log('Content script loaded');

function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .web-page-saver-notes {
      position: fixed;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      width: 300px;
      font-family: Arial, sans-serif;
      background-color: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      border-radius: 4px;
      z-index: 9999;
    }
    .web-page-saver-header {
      background-color: #4CAF50;
      color: white;
      padding: 10px;
      cursor: move;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
    }
    .web-page-saver-header button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      margin-left: 10px;
      color: white;
    }
    .web-page-saver-content {
      padding: 10px;
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #ccc;
      border-top: none;
      border-bottom-left-radius: 4px;
      border-bottom-right-radius: 4px;
    }
    .web-page-saver-notes-content {
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
    }
    .web-page-saver-notes-content * {
      max-width: 100%;
    }
    .web-page-saver-notes-content ul,
    .web-page-saver-notes-content ol {
      padding-left: 20px;
      margin: 10px 0;
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
    .web-page-saver-notes.dark-mode .web-page-saver-content {
      border-color: #666;
      background-color: #444;
    }
    .web-page-saver-notes.dark-mode .web-page-saver-notes-content a {
      color: #8BC34A;
    }
  `;
  document.head.appendChild(style);
}

function injectFontAwesome() {
  const link = document.createElement('link');
  link.href = chrome.runtime.getURL('fontawesome-free-6.6.0-web/css/all.css');
  link.type = 'text/css';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

injectStyles();
injectFontAwesome();

function updateNotesDisplay(linkData) {
  console.log('Updating notes display:', linkData);
  let notesElement = document.querySelector('.web-page-saver-notes');
  if (!notesElement) {
    notesElement = document.createElement('div');
    notesElement.className = 'web-page-saver-notes';
    document.body.appendChild(notesElement);
    console.log('Notes element appended to body');
  }
  
  notesElement.innerHTML = `
    <div class="web-page-saver-header">
      <span>Saved Notes</span>
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
    <div class="web-page-saver-content">
      <div class="web-page-saver-notes-content">${linkData.notes}</div>
    </div>
  `;

  const toggleButton = notesElement.querySelector('.web-page-saver-toggle');
  const editButton = notesElement.querySelector('.web-page-saver-edit');
  const darkModeButton = notesElement.querySelector('.web-page-saver-dark-mode');
  const content = notesElement.querySelector('.web-page-saver-content');

  toggleButton.addEventListener('click', function() {
    if (content.style.display === 'none') {
      content.style.display = 'block';
      toggleButton.innerHTML = '<i class="fas fa-minus"></i>';
    } else {
      content.style.display = 'none';
      toggleButton.innerHTML = '<i class="fas fa-plus"></i>';
    }
  });

  editButton.addEventListener('click', function() {
    chrome.runtime.sendMessage({action: "openPopup", url: window.location.href});
  });

  darkModeButton.addEventListener('click', function() {
    const isDarkMode = notesElement.classList.toggle('dark-mode');
    updateDarkModeIcon(darkModeButton, isDarkMode);
    // Save the dark mode preference
    chrome.storage.local.set({notesDarkMode: isDarkMode});
  });

  makeDraggable(notesElement);

  // Check and apply saved dark mode preference
  chrome.storage.local.get('notesDarkMode', function(result) {
    if (result.notesDarkMode) {
      notesElement.classList.add('dark-mode');
      updateDarkModeIcon(darkModeButton, true);
    }
  });
}

function updateDarkModeIcon(button, isDarkMode) {
  button.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

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
    element.style.left = (element.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    document.removeEventListener('mouseup', closeDragElement, { passive: true });
    document.removeEventListener('mousemove', elementDrag, { passive: true });
  }
}

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