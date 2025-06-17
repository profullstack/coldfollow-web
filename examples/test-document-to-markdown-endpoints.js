import fs from 'fs';
import path from 'path';

/**
 * Test script for the document-to-markdown endpoints (PDF and DOCX)
 */

const API_BASE_URL = 'http://localhost:3000';

// Test data - you would replace these with actual file content in base64
const testPdfBase64 = 'JVBERi0xLjQKJcOkw7zDtsOgCjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgo+PgpzdHJlYW0KQNP...'; // Sample PDF base64
const testDocxBase64 = 'UEsDBBQABgAIAAAAIQDfpNJsWgEAACAFAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAA...'; // Sample DOCX base64
const testDocBase64 = 'UEsDBBQABgAIAAAAIQDfpNJsWgEAACAFAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAA...'; // Sample DOC base64
const testEpubBase64 = 'UEsDBBQABgAIAAAAIQDfpNJsWgEAACAFAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAA...'; // Sample EPUB base64
const testTextBase64 = 'VGhpcyBpcyBhIHNhbXBsZSB0ZXh0IGZpbGUgY29udGVudC4KSXQgY29udGFpbnMgbXVsdGlwbGUgbGluZXMu'; // Sample text base64
const testPptxBase64 = 'UEsDBBQABgAIAAAAIQDfpNJsWgEAACAFAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAA...'; // Sample PPTX base64
const testXlsxBase64 = 'UEsDBBQABgAIAAAAIQDfpNJsWgEAACAFAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAA...'; // Sample XLSX base64

/**
 * Test the PDF-to-markdown endpoint
 */
async function testPdfToMarkdown() {
  console.log('Testing PDF-to-markdown endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/1/pdf-to-markdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use one of the following authentication methods:
        // 1. For JWT tokens:
        'Authorization': 'Bearer YOUR_JWT_TOKEN', // Replace with actual JWT token
        // 2. For API keys (comment out the Authorization header above and use this instead):
        // 'X-API-Key': 'YOUR_API_KEY' // Replace with actual API key (starts with pfs_)
      },
      body: JSON.stringify({
        file: testPdfBase64,
        filename: 'test-document.pdf',
        store: false
      })
    });
    
    if (response.ok) {
      const markdownContent = await response.text();
      console.log('✅ PDF-to-markdown conversion successful');
      console.log('Markdown content preview:', markdownContent.substring(0, 200) + '...');
    } else {
      console.log('❌ PDF-to-markdown conversion failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.error('❌ Error testing PDF-to-markdown:', error.message);
  }
}

/**
 * Test the DOCX-to-markdown endpoint
 */
async function testDocxToMarkdown() {
  console.log('\nTesting DOCX-to-markdown endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/1/docx-to-markdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use one of the following authentication methods:
        // 1. For JWT tokens:
        // 'Authorization': 'Bearer YOUR_JWT_TOKEN', // Replace with actual JWT token
        // 2. For API keys (comment out the Authorization header above and use this instead):
        'X-API-Key': 'YOUR_API_KEY' // Replace with actual API key (starts with pfs_)
      },
      body: JSON.stringify({
        file: testDocxBase64,
        filename: 'test-document.docx',
        store: false
      })
    });
    
    if (response.ok) {
      const markdownContent = await response.text();
      console.log('✅ DOCX-to-markdown conversion successful');
      console.log('Markdown content preview:', markdownContent.substring(0, 200) + '...');
    } else {
      console.log('❌ DOCX-to-markdown conversion failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.error('❌ Error testing DOCX-to-markdown:', error.message);
  }
}

/**
 * Test the DOC-to-markdown endpoint
 */
async function testDocToMarkdown() {
  console.log('\nTesting DOC-to-markdown endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/1/doc-to-markdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use one of the following authentication methods:
        // 1. For JWT tokens:
        // 'Authorization': 'Bearer YOUR_JWT_TOKEN', // Replace with actual JWT token
        // 2. For API keys (comment out the Authorization header above and use this instead):
        'X-API-Key': 'YOUR_API_KEY' // Replace with actual API key (starts with pfs_)
      },
      body: JSON.stringify({
        file: testDocBase64,
        filename: 'test-document.doc',
        store: false
      })
    });
    
    if (response.ok) {
      const markdownContent = await response.text();
      console.log('✅ DOC-to-markdown conversion successful');
      console.log('Markdown content preview:', markdownContent.substring(0, 200) + '...');
    } else {
      console.log('❌ DOC-to-markdown conversion failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.error('❌ Error testing DOC-to-markdown:', error.message);
  }
}

/**
 * Test the EPUB-to-markdown endpoint
 */
async function testEpubToMarkdown() {
  console.log('\nTesting EPUB-to-markdown endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/1/epub-to-markdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use one of the following authentication methods:
        // 1. For JWT tokens:
        // 'Authorization': 'Bearer YOUR_JWT_TOKEN', // Replace with actual JWT token
        // 2. For API keys (comment out the Authorization header above and use this instead):
        'X-API-Key': 'YOUR_API_KEY' // Replace with actual API key (starts with pfs_)
      },
      body: JSON.stringify({
        file: testEpubBase64,
        filename: 'test-book.epub',
        store: false
      })
    });
    
    if (response.ok) {
      const markdownContent = await response.text();
      console.log('✅ EPUB-to-markdown conversion successful');
      console.log('Markdown content preview:', markdownContent.substring(0, 200) + '...');
    } else {
      console.log('❌ EPUB-to-markdown conversion failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.error('❌ Error testing EPUB-to-markdown:', error.message);
  }
}

/**
 * Test the text-to-markdown endpoint
 */
async function testTextToMarkdown() {
  console.log('\nTesting text-to-markdown endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/1/text-to-markdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use one of the following authentication methods:
        // 1. For JWT tokens:
        // 'Authorization': 'Bearer YOUR_JWT_TOKEN', // Replace with actual JWT token
        // 2. For API keys (comment out the Authorization header above and use this instead):
        'X-API-Key': 'YOUR_API_KEY' // Replace with actual API key (starts with pfs_)
      },
      body: JSON.stringify({
        file: testTextBase64,
        filename: 'test-file.txt',
        store: false
      })
    });
    
    if (response.ok) {
      const markdownContent = await response.text();
      console.log('✅ Text-to-markdown conversion successful');
      console.log('Markdown content preview:', markdownContent.substring(0, 200) + '...');
    } else {
      console.log('❌ Text-to-markdown conversion failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.error('❌ Error testing text-to-markdown:', error.message);
  }
}

/**
 * Test the PPTX-to-markdown endpoint
 */
async function testPptxToMarkdown() {
  console.log('\nTesting PPTX-to-markdown endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/1/pptx-to-markdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use one of the following authentication methods:
        // 1. For JWT tokens:
        // 'Authorization': 'Bearer YOUR_JWT_TOKEN', // Replace with actual JWT token
        // 2. For API keys (comment out the Authorization header above and use this instead):
        'X-API-Key': 'YOUR_API_KEY' // Replace with actual API key (starts with pfs_)
      },
      body: JSON.stringify({
        file: testPptxBase64,
        filename: 'test-presentation.pptx',
        store: false
      })
    });
    
    if (response.ok) {
      const markdownContent = await response.text();
      console.log('✅ PPTX-to-markdown conversion successful');
      console.log('Markdown content preview:', markdownContent.substring(0, 200) + '...');
    } else {
      console.log('❌ PPTX-to-markdown conversion failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.error('❌ Error testing PPTX-to-markdown:', error.message);
  }
}

/**
 * Test the XLSX-to-markdown endpoint
 */
async function testXlsxToMarkdown() {
  console.log('\nTesting XLSX-to-markdown endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/1/xlsx-to-markdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use one of the following authentication methods:
        // 1. For JWT tokens:
        // 'Authorization': 'Bearer YOUR_JWT_TOKEN', // Replace with actual JWT token
        // 2. For API keys (comment out the Authorization header above and use this instead):
        'X-API-Key': 'YOUR_API_KEY' // Replace with actual API key (starts with pfs_)
      },
      body: JSON.stringify({
        file: testXlsxBase64,
        filename: 'test-spreadsheet.xlsx',
        store: false
      })
    });
    
    if (response.ok) {
      const markdownContent = await response.text();
      console.log('✅ XLSX-to-markdown conversion successful');
      console.log('Markdown content preview:', markdownContent.substring(0, 200) + '...');
    } else {
      console.log('❌ XLSX-to-markdown conversion failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.error('❌ Error testing XLSX-to-markdown:', error.message);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Testing all document-to-markdown endpoints\n');
  
  await testPdfToMarkdown();
  await testDocxToMarkdown();
  await testDocToMarkdown();
  await testEpubToMarkdown();
  await testTextToMarkdown();
  await testPptxToMarkdown();
  await testXlsxToMarkdown();
  
  console.log('\n✨ All tests completed!');
  console.log('\nNote: To run actual tests, you need to:');
  console.log('1. Choose an authentication method:');
  console.log('   a. For JWT tokens: Replace YOUR_JWT_TOKEN with a valid JWT token');
  console.log('   b. For API keys: Comment out the Authorization header and uncomment the X-API-Key header');
  console.log('      Then replace YOUR_API_KEY with a valid API key (starts with pfs_)');
  console.log('2. Replace the test base64 content with actual file content');
  console.log('3. Ensure the server is running on the correct port');
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export {
  testPdfToMarkdown,
  testDocxToMarkdown,
  testDocToMarkdown,
  testEpubToMarkdown,
  testTextToMarkdown,
  testPptxToMarkdown,
  testXlsxToMarkdown
};