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

  // Function to display saved links
  function displaySavedLinks() {
    mainMenu.style.display = 'none';
    reviewLinksList.style.display = 'block';
    loadSavedLinks();
  }

  // Event listeners
  addLinkButton.addEventListener('click', addLinkHandler);
  reviewLinksButton.addEventListener('click', displaySavedLinks);
  saveLinkButton.addEventListener('click', saveLinkHandler);
  cancelAddButton.addEventListener('click', cancelAddHandler);
  backToMenuButton.addEventListener('click', backToMenuHandler);

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

  // Function definitions
  function addLinkHandler() {
    console.log('Add link button clicked');
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      console.log('Chrome tabs query executed');
      if (tabs[0]) {
        const currentTab = tabs[0];
        mainMenu.style.display = 'none';
        addLinkForm.style.display = 'block';
        aliasInput.value = currentTab.title;
        
        chrome.storage.local.get('savedLinks', function(result) {
          console.log('Chrome storage get executed');
          const savedLinks = result.savedLinks || [];
          const existingLink = savedLinks.find(link => link.url === currentTab.url);
          if (existingLink) {
            richTextEditorElement.innerHTML = existingLink.notes;
            saveLinkButton.textContent = 'Update';
          } else {
            richTextEditorElement.innerHTML = '';
            saveLinkButton.textContent = 'Save';
          }
        });
      } else {
        console.error('No active tab found');
      }
    });
  }

  function saveLinkHandler() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      const editUrl = saveLinkButton.getAttribute('data-edit-url');
      const linkData = {
        url: editUrl || currentTab.url,
        alias: aliasInput.value || currentTab.title,
        notes: richTextEditorElement.innerHTML,
        date: new Date().toISOString()
      };
      saveLinkData(linkData);
      saveLinkButton.removeAttribute('data-edit-url');
    });
  }

  function cancelAddHandler() {
    addLinkForm.style.display = 'none';
    mainMenu.style.display = 'block';
  }

  function backToMenuHandler() {
    reviewLinksList.style.display = 'none';
    mainMenu.style.display = 'block';
  }

  function editorToolbarHandler(e) {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Stop event propagation

    if (e.target.closest('button')) {
      const button = e.target.closest('button');
      const command = button.getAttribute('data-command');
      
      if (command === 'createLink') {
        const url = prompt('Enter the URL:');
        if (url) document.execCommand(command, false, url);
      } else if (command) {
        document.execCommand(command, false, null);
      } else if (button.id === 'text-color-btn') {
        toggleColorOptions('text-color-options');
      } else if (button.id === 'bg-color-btn') {
        toggleColorOptions('bg-color-options');
      } else if (button.parentElement.classList.contains('color-options')) {
        const color = button.getAttribute('data-color');
        const command = button.parentElement.id === 'text-color-options' ? 'foreColor' : 'hiliteColor';
        document.execCommand(command, false, color);
        toggleColorOptions(button.parentElement.id);
      }
    }
  }

  function toggleColorOptions(id) {
    const options = document.getElementById(id);
    options.style.display = options.style.display === 'none' ? 'flex' : 'none';
  }

  // Add click event listener to close color options when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.color-dropdown')) {
      document.querySelectorAll('.color-options').forEach(el => el.style.display = 'none');
    }
  });

  function saveLinkData(linkData) {
    chrome.storage.local.get('savedLinks', function(result) {
      let savedLinks = result.savedLinks || [];
      const existingLinkIndex = savedLinks.findIndex(link => link.url === linkData.url);
      
      if (existingLinkIndex !== -1) {
        // Update existing link
        savedLinks[existingLinkIndex] = linkData;
      } else {
        // Add new link
        savedLinks.push(linkData);
      }
      
      chrome.storage.local.set({savedLinks: savedLinks}, function() {
        console.log('Link saved/updated:', linkData);
        // Show confirmation message
        showMessage('Link saved successfully!');
        // Reset form and return to main menu
        resetForm();
        
        // Notify content script to update the notes
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs[0]) {
            console.log('Sending updateNotes message to content script');
            chrome.tabs.sendMessage(tabs[0].id, {action: "updateNotes", linkData: linkData}, function(response) {
              if (chrome.runtime.lastError) {
                console.error('Error sending message:', chrome.runtime.lastError);
              } else {
                console.log('Message sent successfully');
              }
            });
          } else {
            console.error('No active tab found');
          }
        });
      });
    });
  }

  function showMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.className = 'message';
    document.body.appendChild(messageElement);
    setTimeout(() => messageElement.remove(), 3000);
  }

  function resetForm() {
    aliasInput.value = '';
    richTextEditorElement.innerHTML = '';
    addLinkForm.style.display = 'none';
    mainMenu.style.display = 'block';
  }

  function loadSavedLinks() {
    chrome.storage.local.get('savedLinks', function(result) {
      const savedLinks = result.savedLinks || [];
      console.log('Loaded saved links:', savedLinks);
      
      // Clear existing content
      reviewLinksList.innerHTML = '<button id="back-to-menu">Back to Menu</button>';
      
      if (savedLinks.length === 0) {
        reviewLinksList.innerHTML += '<p>No saved links yet.</p>';
      } else {
        // Sort links by date (newest first)
        savedLinks.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Group links by date
        const groupedLinks = groupByDate(savedLinks);
        
        for (const [date, links] of Object.entries(groupedLinks)) {
          const dateHeader = document.createElement('h3');
          dateHeader.textContent = new Date(date).toLocaleDateString();
          reviewLinksList.appendChild(dateHeader);
          
          const linkList = document.createElement('ul');
          links.forEach(link => {
            const linkItem = document.createElement('li');
            linkItem.innerHTML = `
              <a href="${link.url}" target="_blank">${link.alias || link.url}</a>
              <button class="edit-link" data-url="${link.url}">Edit</button>
              <button class="delete-link" data-url="${link.url}">Delete</button>
            `;
            linkList.appendChild(linkItem);
          });
          reviewLinksList.appendChild(linkList);
        }
      }
      
      // Add event listeners for edit and delete buttons
      addLinkActionListeners();
      
      // Add event listener for the "Back to Menu" button
      const backToMenuButton = document.getElementById('back-to-menu');
      backToMenuButton.addEventListener('click', backToMenuHandler);
    });
  }

  function groupByDate(links) {
    return links.reduce((groups, link) => {
      const date = new Date(link.date).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(link);
      return groups;
    }, {});
  }

  function addLinkActionListeners() {
    document.querySelectorAll('.edit-link').forEach(button => {
      button.addEventListener('click', function() {
        const url = this.getAttribute('data-url');
        editLink(url);
      });
    });
    
    document.querySelectorAll('.delete-link').forEach(button => {
      button.addEventListener('click', function() {
        const url = this.getAttribute('data-url');
        deleteLink(url);
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
          showMessage('Link deleted successfully!');
          loadSavedLinks();
        });
      });
    }
  }
});