import fs from 'fs';

/**
 * Example script for testing the PPTX-to-markdown endpoint
 * 
 * Note: PowerPoint conversion has limitations:
 * - Only text content is extracted, layout is lost
 * - Images, animations, and complex formatting are not converted
 * - Slide structure may be preserved as headings
 */

const API_BASE_URL = 'http://localhost:3000';

// Sample PPTX base64 content - replace with actual PPTX file content
const samplePptxBase64 = 'UEsDBBQABgAIAAAAIQDfpNJsWgEAACAFAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAA...';

/**
 * Convert a PPTX file to Markdown
 * @param {string} pptxBase64 - Base64 encoded PPTX content
 * @param {string} filename - Original filename
 * @param {boolean} store - Whether to store in Supabase
 * @returns {Promise<string>} - Markdown content
 */
async function convertPptxToMarkdown(pptxBase64, filename, store = false) {
  try {
    console.log(`🔄 Converting PPTX "${filename}" to Markdown...`);
    console.log('⚠️  Note: Only text content will be extracted, layout and images will be lost');
    
    const response = await fetch(`${API_BASE_URL}/api/1/pptx-to-markdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_AUTH_TOKEN' // Replace with actual token
      },
      body: JSON.stringify({
        file: pptxBase64,
        filename: filename,
        store: store
      })
    });
    
    if (response.ok) {
      const markdownContent = await response.text();
      console.log('✅ PPTX conversion successful!');
      
      // Optionally save to file
      const outputFilename = filename.replace(/\.pptx$/i, '.md');
      fs.writeFileSync(outputFilename, markdownContent);
      console.log(`📄 Markdown saved to: ${outputFilename}`);
      
      return markdownContent;
    } else {
      const errorText = await response.text();
      throw new Error(`Conversion failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Error converting PPTX to Markdown:', error.message);
    throw error;
  }
}

/**
 * Example usage with file reading
 */
async function exampleWithFile() {
  try {
    // Read a PPTX file and convert to base64
    const pptxPath = './sample-presentation.pptx'; // Replace with actual PPTX path
    
    if (fs.existsSync(pptxPath)) {
      const pptxBuffer = fs.readFileSync(pptxPath);
      const pptxBase64 = pptxBuffer.toString('base64');
      
      const markdownContent = await convertPptxToMarkdown(pptxBase64, 'sample-presentation.pptx', false);
      
      console.log('\n📝 Markdown preview:');
      console.log(markdownContent.substring(0, 500) + '...');
    } else {
      console.log('📁 Sample PPTX file not found. Using sample base64 content instead.');
      await convertPptxToMarkdown(samplePptxBase64, 'sample.pptx', false);
    }
  } catch (error) {
    console.error('Example failed:', error.message);
  }
}

/**
 * Run the example
 */
async function runExample() {
  console.log('🧪 PPTX to Markdown Conversion Example\n');
  
  console.log('📋 Setup Instructions:');
  console.log('1. Replace YOUR_AUTH_TOKEN with a valid authentication token');
  console.log('2. Place a PPTX file named "sample-presentation.pptx" in this directory, or');
  console.log('3. Replace samplePptxBase64 with actual PPTX content in base64 format');
  console.log('4. Ensure the server is running on the correct port\n');
  
  console.log('⚠️  PowerPoint Conversion Limitations:');
  console.log('• Only text content is extracted from slides');
  console.log('• Layout, images, animations, and complex formatting are lost');
  console.log('• Slide structure may be preserved as headings in markdown');
  console.log('• For better layout preservation, consider converting to PDF first\n');
  
  await exampleWithFile();
  
  console.log('\n✨ Example completed!');
}

// Run example if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExample();
}

export { convertPptxToMarkdown };