import fs from 'fs';

/**
 * Example script for testing the text-to-markdown endpoint
 */

const API_BASE_URL = 'http://localhost:3000';

// Sample text base64 content - replace with actual text file content
const sampleTextBase64 = 'VGhpcyBpcyBhIHNhbXBsZSB0ZXh0IGZpbGUgY29udGVudC4KSXQgY29udGFpbnMgbXVsdGlwbGUgbGluZXMuCgpIZXJlIGlzIGEgc2Vjb25kIHBhcmFncmFwaC4KCkFuZCBhIHRoaXJkIG9uZS4=';

/**
 * Convert a text file to Markdown
 * @param {string} textBase64 - Base64 encoded text content
 * @param {string} filename - Original filename
 * @param {boolean} store - Whether to store in Supabase
 * @returns {Promise<string>} - Markdown content
 */
async function convertTextToMarkdown(textBase64, filename, store = false) {
  try {
    console.log(`🔄 Converting text file "${filename}" to Markdown...`);
    
    const response = await fetch(`${API_BASE_URL}/api/1/text-to-markdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_AUTH_TOKEN' // Replace with actual token
      },
      body: JSON.stringify({
        file: textBase64,
        filename: filename,
        store: store
      })
    });
    
    if (response.ok) {
      const markdownContent = await response.text();
      console.log('✅ Text conversion successful!');
      
      // Optionally save to file
      const outputFilename = filename.replace(/\.txt$/i, '.md');
      fs.writeFileSync(outputFilename, markdownContent);
      console.log(`📄 Markdown saved to: ${outputFilename}`);
      
      return markdownContent;
    } else {
      const errorText = await response.text();
      throw new Error(`Conversion failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Error converting text to Markdown:', error.message);
    throw error;
  }
}

/**
 * Example usage with file reading
 */
async function exampleWithFile() {
  try {
    // Read a text file and convert to base64
    const textPath = './sample-text.txt'; // Replace with actual text file path
    
    if (fs.existsSync(textPath)) {
      const textBuffer = fs.readFileSync(textPath);
      const textBase64 = textBuffer.toString('base64');
      
      const markdownContent = await convertTextToMarkdown(textBase64, 'sample-text.txt', false);
      
      console.log('\n📝 Markdown preview:');
      console.log(markdownContent.substring(0, 500) + '...');
    } else {
      console.log('📁 Sample text file not found. Using sample base64 content instead.');
      await convertTextToMarkdown(sampleTextBase64, 'sample.txt', false);
    }
  } catch (error) {
    console.error('Example failed:', error.message);
  }
}

/**
 * Example creating a text file and converting it
 */
async function exampleCreateAndConvert() {
  try {
    // Create a sample text file
    const sampleText = `# Sample Text Document

This is a plain text file that will be converted to Markdown.

## Features
- Simple text formatting
- Multiple paragraphs
- Line breaks preserved

The conversion process will:
1. Preserve paragraph structure
2. Maintain line breaks
3. Convert to proper Markdown format

This is useful for converting plain text documents to Markdown format.`;

    // Write sample file
    fs.writeFileSync('generated-sample.txt', sampleText);
    console.log('📝 Created sample text file: generated-sample.txt');
    
    // Convert to base64 and process
    const textBase64 = Buffer.from(sampleText).toString('base64');
    const markdownContent = await convertTextToMarkdown(textBase64, 'generated-sample.txt', false);
    
    console.log('\n📝 Original text:');
    console.log(sampleText.substring(0, 200) + '...');
    
    console.log('\n📝 Converted markdown:');
    console.log(markdownContent.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('Create and convert example failed:', error.message);
  }
}

/**
 * Run the example
 */
async function runExample() {
  console.log('🧪 Text to Markdown Conversion Example\n');
  
  console.log('📋 Setup Instructions:');
  console.log('1. Replace YOUR_AUTH_TOKEN with a valid authentication token');
  console.log('2. Place a text file named "sample-text.txt" in this directory, or');
  console.log('3. Replace sampleTextBase64 with actual text content in base64 format');
  console.log('4. Ensure the server is running on the correct port\n');
  
  console.log('📄 Text to Markdown conversion is useful for:');
  console.log('• Converting plain text documents to Markdown format');
  console.log('• Preserving paragraph structure and line breaks');
  console.log('• Preparing text for Markdown-based documentation systems\n');
  
  await exampleWithFile();
  
  console.log('\n🔧 Creating and converting a sample text file...');
  await exampleCreateAndConvert();
  
  console.log('\n✨ Example completed!');
}

// Run example if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExample();
}

export { convertTextToMarkdown };