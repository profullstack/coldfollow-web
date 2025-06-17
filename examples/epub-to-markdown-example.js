import fs from 'fs';

/**
 * Example script for testing the EPUB-to-markdown endpoint
 */

const API_BASE_URL = 'http://localhost:3000';

// Sample EPUB base64 content - replace with actual EPUB file content
const sampleEpubBase64 = 'UEsDBBQABgAIAAAAIQDfpNJsWgEAACAFAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAA...';

/**
 * Convert an EPUB file to Markdown
 * @param {string} epubBase64 - Base64 encoded EPUB content
 * @param {string} filename - Original filename
 * @param {boolean} store - Whether to store in Supabase
 * @returns {Promise<string>} - Markdown content
 */
async function convertEpubToMarkdown(epubBase64, filename, store = false) {
  try {
    console.log(`🔄 Converting EPUB "${filename}" to Markdown...`);
    
    const response = await fetch(`${API_BASE_URL}/api/1/epub-to-markdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_AUTH_TOKEN' // Replace with actual token
      },
      body: JSON.stringify({
        file: epubBase64,
        filename: filename,
        store: store
      })
    });
    
    if (response.ok) {
      const markdownContent = await response.text();
      console.log('✅ EPUB conversion successful!');
      
      // Optionally save to file
      const outputFilename = filename.replace(/\.epub$/i, '.md');
      fs.writeFileSync(outputFilename, markdownContent);
      console.log(`📄 Markdown saved to: ${outputFilename}`);
      
      return markdownContent;
    } else {
      const errorText = await response.text();
      throw new Error(`Conversion failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Error converting EPUB to Markdown:', error.message);
    throw error;
  }
}

/**
 * Example usage with file reading
 */
async function exampleWithFile() {
  try {
    // Read an EPUB file and convert to base64
    const epubPath = './sample-book.epub'; // Replace with actual EPUB path
    
    if (fs.existsSync(epubPath)) {
      const epubBuffer = fs.readFileSync(epubPath);
      const epubBase64 = epubBuffer.toString('base64');
      
      const markdownContent = await convertEpubToMarkdown(epubBase64, 'sample-book.epub', false);
      
      console.log('\n📝 Markdown preview:');
      console.log(markdownContent.substring(0, 500) + '...');
    } else {
      console.log('📁 Sample EPUB file not found. Using sample base64 content instead.');
      await convertEpubToMarkdown(sampleEpubBase64, 'sample.epub', false);
    }
  } catch (error) {
    console.error('Example failed:', error.message);
  }
}

/**
 * Run the example
 */
async function runExample() {
  console.log('🧪 EPUB to Markdown Conversion Example\n');
  
  console.log('📋 Setup Instructions:');
  console.log('1. Replace YOUR_AUTH_TOKEN with a valid authentication token');
  console.log('2. Place an EPUB file named "sample-book.epub" in this directory, or');
  console.log('3. Replace sampleEpubBase64 with actual EPUB content in base64 format');
  console.log('4. Ensure the server is running on the correct port\n');
  
  console.log('📚 EPUB Format Information:');
  console.log('• EPUB is a popular e-book format');
  console.log('• Contains structured text, chapters, and metadata');
  console.log('• Pandoc can extract text content and preserve chapter structure');
  console.log('• Images and complex formatting may not be preserved');
  console.log('• Great for converting e-books to documentation format\n');
  
  console.log('📖 Use Cases:');
  console.log('• Converting e-books to Markdown for documentation');
  console.log('• Extracting text content from EPUB files');
  console.log('• Creating Markdown versions of digital books');
  console.log('• Preparing content for static site generators\n');
  
  await exampleWithFile();
  
  console.log('\n✨ Example completed!');
  console.log('\n💡 Tips for EPUB conversion:');
  console.log('• Chapter structure is usually preserved as headings');
  console.log('• Text formatting (bold, italic) is typically maintained');
  console.log('• Images may not be included in the markdown output');
  console.log('• Complex layouts will be simplified to plain text');
}

// Run example if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExample();
}

export { convertEpubToMarkdown };