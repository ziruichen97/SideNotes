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
  const richTextEditor = document.getElementById('rich-text-editor');
  const backToMenuButton = document.getElementById('back-to-menu');

  console.log('UI elements initialized');

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
  const editorToolbar = document.getElementById('editor-toolbar');
  editorToolbar.addEventListener('click', editorToolbarHandler);
  richTextEditor.addEventListener('input', handleEditorInput);

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
            richTextEditor.innerHTML = existingLink.notes;
            saveLinkButton.textContent = 'Update';
          } else {
            richTextEditor.innerHTML = '';
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
        notes: richTextEditor.innerHTML,
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
    if (e.target.tagName === 'BUTTON') {
      const command = e.target.getAttribute('data-command');
      document.execCommand(command, false, null);
    }
  }

  function handleEditorInput(event) {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const startContainer = range.startContainer;
    
    if (startContainer.nodeType === Node.TEXT_NODE) {
      const text = startContainer.textContent;
      const cursorPosition = range.startOffset;
      
      if (text.substr(cursorPosition - 3, 3) === '1. ') {
        event.preventDefault();
        document.execCommand('insertOrderedList', false, null);
        
        // Remove the "1. " text
        const newRange = document.createRange();
        newRange.setStart(startContainer, cursorPosition - 3);
        newRange.setEnd(startContainer, cursorPosition);
        newRange.deleteContents();
        
        selection.removeAllRanges();
        selection.addRange(newRange);
      } else if (text.substr(cursorPosition - 2, 2) === '- ') {
        event.preventDefault();
        document.execCommand('insertUnorderedList', false, null);
        
        // Remove the "- " text
        const newRange = document.createRange();
        newRange.setStart(startContainer, cursorPosition - 2);
        newRange.setEnd(startContainer, cursorPosition);
        newRange.deleteContents();
        
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
  }

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
    richTextEditor.innerHTML = '';
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
        richTextEditor.innerHTML = linkToEdit.notes;
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