import fs from 'fs';

/**
 * Example script for testing the DOC-to-markdown endpoint
 * (Legacy Microsoft Word format)
 */

const API_BASE_URL = 'http://localhost:3000';

// Sample DOC base64 content - replace with actual DOC file content
const sampleDocBase64 = 'UEsDBBQABgAIAAAAIQDfpNJsWgEAACAFAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAA...';

/**
 * Convert a DOC file to Markdown
 * @param {string} docBase64 - Base64 encoded DOC content
 * @param {string} filename - Original filename
 * @param {boolean} store - Whether to store in Supabase
 * @returns {Promise<string>} - Markdown content
 */
async function convertDocToMarkdown(docBase64, filename, store = false) {
  try {
    console.log(`🔄 Converting DOC "${filename}" to Markdown...`);
    
    const response = await fetch(`${API_BASE_URL}/api/1/doc-to-markdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_AUTH_TOKEN' // Replace with actual token
      },
      body: JSON.stringify({
        file: docBase64,
        filename: filename,
        store: store
      })
    });
    
    if (response.ok) {
      const markdownContent = await response.text();
      console.log('✅ DOC conversion successful!');
      
      // Optionally save to file
      const outputFilename = filename.replace(/\.doc$/i, '.md');
      fs.writeFileSync(outputFilename, markdownContent);
      console.log(`📄 Markdown saved to: ${outputFilename}`);
      
      return markdownContent;
    } else {
      const errorText = await response.text();
      throw new Error(`Conversion failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Error converting DOC to Markdown:', error.message);
    throw error;
  }
}

/**
 * Example usage with file reading
 */
async function exampleWithFile() {
  try {
    // Read a DOC file and convert to base64
    const docPath = './sample-document.doc'; // Replace with actual DOC path
    
    if (fs.existsSync(docPath)) {
      const docBuffer = fs.readFileSync(docPath);
      const docBase64 = docBuffer.toString('base64');
      
      const markdownContent = await convertDocToMarkdown(docBase64, 'sample-document.doc', false);
      
      console.log('\n📝 Markdown preview:');
      console.log(markdownContent.substring(0, 500) + '...');
    } else {
      console.log('📁 Sample DOC file not found. Using sample base64 content instead.');
      await convertDocToMarkdown(sampleDocBase64, 'sample.doc', false);
    }
  } catch (error) {
    console.error('Example failed:', error.message);
  }
}

/**
 * Run the example
 */
async function runExample() {
  console.log('🧪 DOC to Markdown Conversion Example\n');
  
  console.log('📋 Setup Instructions:');
  console.log('1. Replace YOUR_AUTH_TOKEN with a valid authentication token');
  console.log('2. Place a DOC file named "sample-document.doc" in this directory, or');
  console.log('3. Replace sampleDocBase64 with actual DOC content in base64 format');
  console.log('4. Ensure the server is running on the correct port\n');
  
  console.log('📄 DOC Format Information:');
  console.log('• DOC is the legacy Microsoft Word format (.doc)');
  console.log('• Different from the newer DOCX format (.docx)');
  console.log('• Pandoc can convert DOC files but DOCX is generally preferred');
  console.log('• If you have a choice, use DOCX format for better compatibility\n');
  
  await exampleWithFile();
  
  console.log('\n✨ Example completed!');
  console.log('\n💡 Note: If you encounter issues with DOC files,');
  console.log('consider converting them to DOCX format first for better results.');
}

// Run example if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExample();
}

export { convertDocToMarkdown };