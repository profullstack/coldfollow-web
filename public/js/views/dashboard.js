import { ApiClient } from '../api-client.js';

/**
 * Initialize the dashboard page
 */
function initDashboard() {
  console.log('Initializing dashboard...');
  
  // Check if user is logged in
  const apiKey = localStorage.getItem('api_key');
  const jwtToken = localStorage.getItem('jwt_token');
  
  console.log('API key exists:', !!apiKey);
  console.log('JWT token exists:', !!jwtToken);
  console.log('JWT token length:', jwtToken ? jwtToken.length : 0);
  
  if (!apiKey && !jwtToken) {
    console.log('No authentication found, redirecting to login page');
    // Redirect to login page
    window.router.navigate('/login');
    return;
  }
  
  // Check if user has an active subscription
  const userJson = localStorage.getItem('user');
  let user = null;
  
  if (userJson) {
    try {
      user = JSON.parse(userJson);
    } catch (e) {
      console.error('Error parsing user JSON:', e);
    }
  }
  
  /**
   * Check if user has access (admin or active subscription)
   * @param {Object} user - User object
   * @returns {boolean} - Whether the user has access
   */
  function hasAccess(user) {
    if (!user) return false;
    if (user.is_admin === true) return true;
    return user.subscription?.status === 'active';
  }
  
  // Check if user has access
  if(user.is_admin === true) {
    
  } else {
    if (!hasAccess(user)) {
    // Redirect to subscription page
    alert('You need an active subscription to access the dashboard.');
    window.router.navigate('/subscription');
    return;
    }
  }
  
  // Set up tab switching
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      tabButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      // Hide all tab content
      document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
      });
      
      // Show selected tab content
      const tabId = button.dataset.tab;
      document.getElementById(`${tabId}-tab`).style.display = 'block';
      
      // If history tab is selected, refresh the document history
      if (tabId === 'history') {
        // Get the document-history component and refresh it
        const historyComponent = document.querySelector('document-history');
        if (historyComponent) {
          console.log('Refreshing document history...');
          historyComponent.loadHistory();
        } else {
          console.error('Document history component not found');
        }
      }
    });
  });
  
  // Set up document type change handler
  const documentTypeSelect = document.getElementById('document-type');
  documentTypeSelect.addEventListener('change', () => {
    // Hide all options containers
    document.querySelectorAll('.options-container').forEach(container => {
      container.style.display = 'none';
    });
    
    // Show options container for selected document type
    const documentType = documentTypeSelect.value;
    const optionsContainer = document.getElementById(`${documentType}-options`);
    if (optionsContainer) {
      optionsContainer.style.display = 'block';
    }
    
    // Update filename extension
    updateFilenameExtension(documentType);
  });
  
  // Set up convert button
  const convertButton = document.getElementById('convert-button');
  if (convertButton) {
    console.log('Found convert button, adding click event listener');
    convertButton.addEventListener('click', convertDocument);
  } else {
    console.error('Convert button not found in the DOM');
  }
  
  // Initialize filename with default extension
  updateFilenameExtension(documentTypeSelect.value);
  
  console.log('Dashboard initialization complete');
}

/**
 * Update the filename extension based on the selected document type
 * @param {string} documentType - The selected document type
 */
function updateFilenameExtension(documentType) {
  const filenameInput = document.getElementById('filename');
  const currentFilename = filenameInput.value || 'document';
  
  // Remove any existing extension
  const baseFilename = currentFilename.replace(/\.\w+$/, '');
  
  // Add new extension based on document type
  const extensions = {
    pdf: '.pdf',
    doc: '.docx',  // Updated from .doc to .docx
    excel: '.xlsx',
    ppt: '.pptx',
    epub: '.epub',
    markdown: '.md'
  };
  
  filenameInput.value = baseFilename + (extensions[documentType] || '');
}

/**
 * Convert the document based on the selected options
 */
async function convertDocument() {
  console.log('Convert button clicked');
  try {
    // Get form values
    const html = document.getElementById('html-input').value;
    console.log('HTML content length:', html ? html.length : 0);
    if (!html) {
      alert('Please enter HTML content');
      return;
    }
    
    const documentType = document.getElementById('document-type').value;
    const filename = document.getElementById('filename').value;
    const storeDocument = document.getElementById('store-document').checked;
    console.log('Converting document:', { documentType, filename, storeDocument });
    
    // Show loading state
    const convertButton = document.getElementById('convert-button');
    const originalButtonText = convertButton.textContent;
    convertButton.textContent = 'Converting...';
    convertButton.disabled = true;
    
    // Prepare request data based on document type
    let result;
    console.log('Preparing to convert document type:', documentType);
    
    switch (documentType) {
      case 'pdf':
        console.log('Converting to PDF');
        const pdfFormat = document.getElementById('pdf-format').value;
        const pdfOrientation = document.getElementById('pdf-orientation').value;
        const pdfOptions = {
          format: pdfFormat,
          orientation: pdfOrientation
        };
        console.log('PDF options:', pdfOptions);
        
        console.log('Calling ApiClient.htmlToPdf...');
        result = await ApiClient.htmlToPdf(html, pdfOptions, filename, storeDocument);
        console.log('PDF conversion successful');
        break;
        
      case 'doc':
        console.log('Converting to DOCX');
        result = await ApiClient.htmlToDoc(html, filename, storeDocument);
        console.log('DOCX conversion successful');
        break;
        
      case 'excel':
        const sheetName = document.getElementById('excel-sheet').value || 'Sheet1';
        result = await ApiClient.htmlToExcel(html, filename, sheetName, storeDocument);
        break;
        
      case 'ppt':
        const title = document.getElementById('ppt-title').value || 'Presentation';
        result = await ApiClient.htmlToPpt(html, filename, title, storeDocument);
        break;
        
      case 'epub':
        const epubTitle = document.getElementById('epub-title').value || '';
        const epubAuthor = document.getElementById('epub-author').value || '';
        result = await ApiClient.htmlToEpub(html, filename, epubTitle, epubAuthor, '', storeDocument);
        break;
        
      case 'markdown':
        const markdown = await ApiClient.htmlToMarkdown(html);
        // For markdown, we'll create a blob and download it
        const markdownBlob = new Blob([markdown], { type: 'text/markdown' });
        ApiClient.downloadBlob(markdownBlob, filename);
        
        // Reset button state
        convertButton.textContent = originalButtonText;
        convertButton.disabled = false;
        
        // Refresh document history if we're storing documents
        if (storeDocument) {
          refreshDocumentHistory();
        }
        
        return;
    }
    
    // Download the result
    ApiClient.downloadBlob(result, filename);
    
    // Reset button state
    convertButton.textContent = originalButtonText;
    convertButton.disabled = false;
    
    // Refresh document history if we're storing documents
    if (storeDocument) {
      refreshDocumentHistory();
    }
  } catch (error) {
    console.error('Error converting document:', error);
    console.error('Error stack:', error.stack);
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    // Show detailed error message
    alert('Error converting document: ' + error.message);
    
    // Reset button state
    const convertButton = document.getElementById('convert-button');
    convertButton.textContent = 'Convert Document';
    convertButton.disabled = false;
  }
}

/**
 * Refresh the document history component
 */
function refreshDocumentHistory() {
  // Get the document-history component and refresh it
  const historyComponent = document.querySelector('document-history');
  if (historyComponent) {
    historyComponent.loadHistory();
  }
}

// Load the document-history component and initialize the dashboard
import('../components/document-history.js')
  .then(() => {
    console.log('Document history component loaded successfully');
    // Initialize the dashboard after the component is loaded
    initDashboard();
  })
  .catch(error => {
    console.error('Error loading document history component:', error);
    // Still initialize the dashboard even if component fails to load
    initDashboard();
  });