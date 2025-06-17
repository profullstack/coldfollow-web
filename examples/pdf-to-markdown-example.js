import fs from 'fs';

/**
 * Example script for testing the PDF-to-markdown endpoint
 */

const API_BASE_URL = 'http://localhost:3000';

// Sample PDF base64 content - replace with actual PDF file content
const samplePdfBase64 = 'JVBERi0xLjQKJcOkw7zDtsOgCjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgo+PgpzdHJlYW0KQNP...';

/**
 * Convert a PDF file to Markdown
 * @param {string} pdfBase64 - Base64 encoded PDF content
 * @param {string} filename - Original filename
 * @param {boolean} store - Whether to store in Supabase
 * @returns {Promise<string>} - Markdown content
 */
async function convertPdfToMarkdown(pdfBase64, filename, store = false) {
  try {
    console.log(`🔄 Converting PDF "${filename}" to Markdown...`);
    
    const response = await fetch(`${API_BASE_URL}/api/1/pdf-to-markdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_AUTH_TOKEN' // Replace with actual token
      },
      body: JSON.stringify({
        file: pdfBase64,
        filename: filename,
        store: store
      })
    });
    
    if (response.ok) {
      const markdownContent = await response.text();
      console.log('✅ PDF conversion successful!');
      
      // Optionally save to file
      const outputFilename = filename.replace(/\.pdf$/i, '.md');
      fs.writeFileSync(outputFilename, markdownContent);
      console.log(`📄 Markdown saved to: ${outputFilename}`);
      
      return markdownContent;
    } else {
      const errorText = await response.text();
      throw new Error(`Conversion failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Error converting PDF to Markdown:', error.message);
    throw error;
  }
}

/**
 * Example usage with file reading
 */
async function exampleWithFile() {
  try {
    // Read a PDF file and convert to base64
    const pdfPath = './sample-document.pdf'; // Replace with actual PDF path
    
    if (fs.existsSync(pdfPath)) {
      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfBase64 = pdfBuffer.toString('base64');
      
      const markdownContent = await convertPdfToMarkdown(pdfBase64, 'sample-document.pdf', false);
      
      console.log('\n📝 Markdown preview:');
      console.log(markdownContent.substring(0, 500) + '...');
    } else {
      console.log('📁 Sample PDF file not found. Using sample base64 content instead.');
      await convertPdfToMarkdown(samplePdfBase64, 'sample.pdf', false);
    }
  } catch (error) {
    console.error('Example failed:', error.message);
  }
}

/**
 * Run the example
 */
async function runExample() {
  console.log('🧪 PDF to Markdown Conversion Example\n');
  
  console.log('📋 Setup Instructions:');
  console.log('1. Replace YOUR_AUTH_TOKEN with a valid authentication token');
  console.log('2. Place a PDF file named "sample-document.pdf" in this directory, or');
  console.log('3. Replace samplePdfBase64 with actual PDF content in base64 format');
  console.log('4. Ensure the server is running on the correct port\n');
  
  await exampleWithFile();
  
  console.log('\n✨ Example completed!');
}

// Run example if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExample();
}

export { convertPdfToMarkdown };