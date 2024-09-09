document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded event fired');

  // Initialize UI elements
  const mainMenu = document.getElementById('main-menu');
  const addLinkForm = document.getElementById('add-link-form');
  const reviewLinksList = document.getElementById('review-links-list');
  const addLinkButton = document.getElementById('add-link');
  const reviewLinksButton = document.getElementById('review-links');
  const saveLinkButton = document.getElementById('save-link');
  const cancelAddButton = document.getElementById('cancel-add');
  const aliasInput = document.getElementById('alias');
  const richTextEditorContainer = document.getElementById('rich-text-editor-container');
  const backToMenuButton = document.getElementById('back-to-menu');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const exportButton = document.getElementById('export-data');
  const importButton = document.getElementById('import-data');

  console.log('UI elements initialized');

  // Create and append the new editor HTML
  const editorToolbar = `
    <div id="editor-toolbar">
      <button data-command="bold" title="Bold"><i class="fas fa-bold"></i></button>
      <button data-command="italic" title="Italic"><i class="fas fa-italic"></i></button>
      <button data-command="underline" title="Underline"><i class="fas fa-underline"></i></button>
      <button data-command="insertUnorderedList" title="Bullet List"><i class="fas fa-list-ul"></i></button>
      <button data-command="insertOrderedList" title="Numbered List"><i class="fas fa-list-ol"></i></button>
      <button data-command="createLink" title="Insert Link"><i class="fas fa-link"></i></button>
      <button data-command="removeFormat" title="Clear Formatting"><i class="fas fa-remove-format"></i></button>
      <div class="color-dropdown">
        <button id="text-color-btn" title="Text Color"><i class="fas fa-font"></i></button>
        <div class="color-options" id="text-color-options">
          <button data-color="#000000" style="background-color: #000000;"></button>
          <button data-color="#0000FF" style="background-color: #0000FF;"></button>
          <button data-color="#008000" style="background-color: #008000;"></button>
          <button data-color="#FF0000" style="background-color: #FF0000;"></button>
          <button data-color="#800080" style="background-color: #800080;"></button>
        </div>
      </div>
      <div class="color-dropdown">
        <button id="bg-color-btn" title="Background Color"><i class="fas fa-fill-drip"></i></button>
        <div class="color-options" id="bg-color-options">
          <button data-color="#FFFFFF" style="background-color: #FFFFFF; border: 1px solid #ccc;"></button>
          <button data-color="#FFFF00" style="background-color: #FFFF00;"></button>
          <button data-color="#00FFFF" style="background-color: #00FFFF;"></button>
          <button data-color="#FFA500" style="background-color: #FFA500;"></button>
          <button data-color="#FFC0CB" style="background-color: #FFC0CB;"></button>
        </div>
      </div>
    </div>
  `;

  const richTextEditor = `<div id="rich-text-editor" contenteditable="true"></div>`;

  richTextEditorContainer.innerHTML = editorToolbar + richTextEditor;

  const richTextEditorElement = document.getElementById('rich-text-editor');

  // Event listeners
  addLinkButton.addEventListener('click', addLinkHandler);
  reviewLinksButton.addEventListener('click', displaySavedLinks);
  saveLinkButton.addEventListener('click', saveLinkHandler);
  cancelAddButton.addEventListener('click', cancelAddHandler);
  backToMenuButton.addEventListener('click', backToMenuHandler);
  darkModeToggle.addEventListener('click', toggleDarkMode);
  exportButton.addEventListener('click', exportData);
  importButton.addEventListener('click', importData);
  document.addEventListener('keydown', handleKeyboardShortcuts);
  richTextEditorElement.addEventListener('input', scheduleAutoSave);

  // Rich text editor functionality
  document.getElementById('editor-toolbar').addEventListener('click', editorToolbarHandler);

  // Load saved links immediately when popup is opened
  loadSavedLinks();

  // Message listener for opening edit form
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "openEditForm") {
      editLink(request.url);
    }
  });

  // Initialize dark mode
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    updateContentScriptDarkMode(true);
  }

  function addLinkHandler() {
    console.log('Add link button clicked');
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        const currentTab = tabs[0];
        mainMenu.style.display = 'none';
        addLinkForm.style.display = 'block';
        aliasInput.value = currentTab.title;
        richTextEditorElement.innerHTML = '';
        console.log('Switched to add link form');
      } else {
        console.error('No active tab found');
      }
    });
  }

  function displaySavedLinks() {
    console.log('Review links button clicked');
    mainMenu.style.display = 'none';
    reviewLinksList.style.display = 'block';
    loadSavedLinks();
  }

  function saveLinkHandler() {
    console.log('Save link button clicked');
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        const currentTab = tabs[0];
        const linkData = {
          url: currentTab.url,
          alias: aliasInput.value || currentTab.title,
          notes: richTextEditorElement.innerHTML, // Use innerHTML instead of innerText
          date: new Date().toISOString()
        };
        saveLinkData(linkData);
      } else {
        console.error('No active tab found');
      }
    });
  }

  function cancelAddHandler() {
    console.log('Cancel add button clicked');
    addLinkForm.style.display = 'none';
    mainMenu.style.display = 'block';
  }

  function backToMenuHandler() {
    console.log('Back to menu button clicked');
    reviewLinksList.style.display = 'none';
    addLinkForm.style.display = 'none';
    mainMenu.style.display = 'block';
  }

  function toggleDarkMode() {
    console.log('Dark mode toggle clicked');
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    updateContentScriptDarkMode(isDarkMode);
    console.log('Dark mode set to:', isDarkMode);
  }

  function updateContentScriptDarkMode(isDarkMode) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "updateDarkMode", isDarkMode: isDarkMode});
      }
    });
  }

  function exportData() {
    console.log('Export button clicked');
    chrome.storage.local.get('savedLinks', function(result) {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result.savedLinks));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "web_page_saver_export.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      console.log('Data exported');
    });
  }

  function importData() {
    console.log('Import button clicked');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(event) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const importedLinks = JSON.parse(e.target.result);
          chrome.storage.local.set({savedLinks: importedLinks}, function() {
            console.log('Data imported successfully');
            loadSavedLinks();
          });
        } catch (error) {
          console.error('Error importing data:', error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function loadSavedLinks() {
    console.log('Loading saved links');
    chrome.storage.local.get('savedLinks', function(result) {
      const savedLinks = result.savedLinks || [];
      reviewLinksList.innerHTML = '<button id="back-to-menu">Back to Menu</button>';
      savedLinks.forEach(link => {
        const linkElement = document.createElement('div');
        linkElement.innerHTML = `
          <a href="${link.url}" target="_blank">${link.alias || link.url}</a>
          <button class="edit-link" data-url="${link.url}">Edit</button>
          <button class="delete-link" data-url="${link.url}">Delete</button>
        `;
        reviewLinksList.appendChild(linkElement);
      });
      console.log('Saved links loaded:', savedLinks.length);
      
      // Re-add event listener for the new "Back to Menu" button
      document.getElementById('back-to-menu').addEventListener('click', backToMenuHandler);
      
      // Add event listeners for edit and delete buttons
      document.querySelectorAll('.edit-link').forEach(button => {
        button.addEventListener('click', function() {
          editLink(this.getAttribute('data-url'));
        });
      });
      document.querySelectorAll('.delete-link').forEach(button => {
        button.addEventListener('click', function() {
          deleteLink(this.getAttribute('data-url'));
        });
      });
    });
  }

  function saveLinkData(linkData) {
    chrome.storage.local.get('savedLinks', function(result) {
      let savedLinks = result.savedLinks || [];
      const existingLinkIndex = savedLinks.findIndex(link => link.url === linkData.url);
      if (existingLinkIndex !== -1) {
        savedLinks[existingLinkIndex] = linkData;
      } else {
        savedLinks.push(linkData);
      }
      chrome.storage.local.set({savedLinks: savedLinks}, function() {
        console.log('Link saved:', linkData);
        addLinkForm.style.display = 'none';
        mainMenu.style.display = 'block';
        // Update the notes display in the content script
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "updateNotes", linkData: linkData});
          }
        });
      });
    });
  }

  function editLink(url) {
    chrome.storage.local.get('savedLinks', function(result) {
      const savedLinks = result.savedLinks || [];
      const linkToEdit = savedLinks.find(link => link.url === url);
      if (linkToEdit) {
        mainMenu.style.display = 'none';
        reviewLinksList.style.display = 'none';
        addLinkForm.style.display = 'block';
        aliasInput.value = linkToEdit.alias;
        richTextEditorElement.innerHTML = linkToEdit.notes;
        saveLinkButton.setAttribute('data-edit-url', url);
      }
    });
  }

  function deleteLink(url) {
    if (confirm('Are you sure you want to delete this link?')) {
      chrome.storage.local.get('savedLinks', function(result) {
        let savedLinks = result.savedLinks || [];
        savedLinks = savedLinks.filter(link => link.url !== url);
        chrome.storage.local.set({savedLinks: savedLinks}, function() {
          console.log('Link deleted');
          loadSavedLinks();
        });
      });
    }
  }

  function handleKeyboardShortcuts(e) {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveLinkHandler();
    }
  }

  function scheduleAutoSave() {
    // Implement autosave functionality here
  }

  function editorToolbarHandler(e) {
    if (e.target.closest('button')) {
      const button = e.target.closest('button');
      const command = button.getAttribute('data-command');
      if (command) {
        e.preventDefault(); // Prevent default action
        if (command === 'createLink') {
          const url = prompt('Enter the URL:');
          if (url) document.execCommand(command, false, url);
        } else if (command === 'insertUnorderedList' || command === 'insertOrderedList') {
          // Special handling for list commands
          document.execCommand(command, false, null);
          // Force focus back to the editor
          richTextEditorElement.focus();
        } else {
          document.execCommand(command, false, null);
        }
      }
    }
  }

  console.log('All event listeners added');
});