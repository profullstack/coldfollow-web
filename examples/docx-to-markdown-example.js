import fs from 'fs';

/**
 * Example script for testing the DOCX-to-markdown endpoint
 */

const API_BASE_URL = 'http://localhost:3000';

// Sample DOCX base64 content - replace with actual DOCX file content
const sampleDocxBase64 = 'UEsDBBQABgAIAAAAIQDfpNJsWgEAACAFAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAA...';

/**
 * Convert a DOCX file to Markdown
 * @param {string} docxBase64 - Base64 encoded DOCX content
 * @param {string} filename - Original filename
 * @param {boolean} store - Whether to store in Supabase
 * @returns {Promise<string>} - Markdown content
 */
async function convertDocxToMarkdown(docxBase64, filename, store = false) {
  try {
    console.log(`🔄 Converting DOCX "${filename}" to Markdown...`);
    
    const response = await fetch(`${API_BASE_URL}/api/1/docx-to-markdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_AUTH_TOKEN' // Replace with actual token
      },
      body: JSON.stringify({
        file: docxBase64,
        filename: filename,
        store: store
      })
    });
    
    if (response.ok) {
      const markdownContent = await response.text();
      console.log('✅ DOCX conversion successful!');
      
      // Optionally save to file
      const outputFilename = filename.replace(/\.docx$/i, '.md');
      fs.writeFileSync(outputFilename, markdownContent);
      console.log(`📄 Markdown saved to: ${outputFilename}`);
      
      return markdownContent;
    } else {
      const errorText = await response.text();
      throw new Error(`Conversion failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Error converting DOCX to Markdown:', error.message);
    throw error;
  }
}

/**
 * Example usage with file reading
 */
async function exampleWithFile() {
  try {
    // Read a DOCX file and convert to base64
    const docxPath = './sample-document.docx'; // Replace with actual DOCX path
    
    if (fs.existsSync(docxPath)) {
      const docxBuffer = fs.readFileSync(docxPath);
      const docxBase64 = docxBuffer.toString('base64');
      
      const markdownContent = await convertDocxToMarkdown(docxBase64, 'sample-document.docx', false);
      
      console.log('\n📝 Markdown preview:');
      console.log(markdownContent.substring(0, 500) + '...');
    } else {
      console.log('📁 Sample DOCX file not found. Using sample base64 content instead.');
      await convertDocxToMarkdown(sampleDocxBase64, 'sample.docx', false);
    }
  } catch (error) {
    console.error('Example failed:', error.message);
  }
}

/**
 * Run the example
 */
async function runExample() {
  console.log('🧪 DOCX to Markdown Conversion Example\n');
  
  console.log('📋 Setup Instructions:');
  console.log('1. Replace YOUR_AUTH_TOKEN with a valid authentication token');
  console.log('2. Place a DOCX file named "sample-document.docx" in this directory, or');
  console.log('3. Replace sampleDocxBase64 with actual DOCX content in base64 format');
  console.log('4. Ensure the server is running on the correct port\n');
  
  await exampleWithFile();
  
  console.log('\n✨ Example completed!');
}

// Run example if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExample();
}

export { convertDocxToMarkdown };