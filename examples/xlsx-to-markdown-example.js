import fs from 'fs';

/**
 * Example script for testing the XLSX-to-markdown endpoint
 * 
 * IMPORTANT: Excel conversion has significant limitations:
 * - Pandoc's XLSX support is experimental and may not work reliably
 * - Only simple spreadsheets with text content may convert successfully
 * - Complex formulas, charts, and formatting are not supported
 * - Consider converting Excel files to CSV format for better results
 */

const API_BASE_URL = 'http://localhost:3000';

// Sample XLSX base64 content - replace with actual XLSX file content
const sampleXlsxBase64 = 'UEsDBBQABgAIAAAAIQDfpNJsWgEAACAFAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAA...';

/**
 * Convert an XLSX file to Markdown
 * @param {string} xlsxBase64 - Base64 encoded XLSX content
 * @param {string} filename - Original filename
 * @param {boolean} store - Whether to store in Supabase
 * @returns {Promise<string>} - Markdown content
 */
async function convertXlsxToMarkdown(xlsxBase64, filename, store = false) {
  try {
    console.log(`🔄 Converting XLSX "${filename}" to Markdown...`);
    console.log('⚠️  Warning: Excel conversion is experimental and may fail');
    console.log('💡 Tip: Consider converting to CSV format for better results');
    
    const response = await fetch(`${API_BASE_URL}/api/1/xlsx-to-markdown`, {
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
        file: xlsxBase64,
        filename: filename,
        store: store
      })
    });
    
    if (response.ok) {
      const markdownContent = await response.text();
      console.log('✅ XLSX conversion successful!');
      
      // Optionally save to file
      const outputFilename = filename.replace(/\.xlsx$/i, '.md');
      fs.writeFileSync(outputFilename, markdownContent);
      console.log(`📄 Markdown saved to: ${outputFilename}`);
      
      return markdownContent;
    } else {
      const errorText = await response.text();
      console.log('❌ XLSX conversion failed - this is expected for complex spreadsheets');
      throw new Error(`Conversion failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Error converting XLSX to Markdown:', error.message);
    console.log('💡 Suggestion: Try converting your Excel file to CSV format first');
    throw error;
  }
}

/**
 * Example usage with file reading
 */
async function exampleWithFile() {
  try {
    // Read an XLSX file and convert to base64
    const xlsxPath = './sample-spreadsheet.xlsx'; // Replace with actual XLSX path
    
    if (fs.existsSync(xlsxPath)) {
      const xlsxBuffer = fs.readFileSync(xlsxPath);
      const xlsxBase64 = xlsxBuffer.toString('base64');
      
      const markdownContent = await convertXlsxToMarkdown(xlsxBase64, 'sample-spreadsheet.xlsx', false);
      
      console.log('\n📝 Markdown preview:');
      console.log(markdownContent.substring(0, 500) + '...');
    } else {
      console.log('📁 Sample XLSX file not found. Using sample base64 content instead.');
      await convertXlsxToMarkdown(sampleXlsxBase64, 'sample.xlsx', false);
    }
  } catch (error) {
    console.error('Example failed:', error.message);
  }
}

/**
 * Run the example
 */
async function runExample() {
  console.log('🧪 XLSX to Markdown Conversion Example\n');
  
  console.log('📋 Setup Instructions:');
  console.log('1. Choose an authentication method:');
  console.log('   a. For JWT tokens: Replace YOUR_JWT_TOKEN with a valid JWT token');
  console.log('   b. For API keys: Comment out the Authorization header and uncomment the X-API-Key header');
  console.log('      Then replace YOUR_API_KEY with a valid API key (starts with pfs_)');
  console.log('2. Place an XLSX file named "sample-spreadsheet.xlsx" in this directory, or');
  console.log('3. Replace sampleXlsxBase64 with actual XLSX content in base64 format');
  console.log('4. Ensure the server is running on the correct port\n');
  
  console.log('⚠️  Excel Conversion Limitations:');
  console.log('• Pandoc\'s XLSX support is experimental and unreliable');
  console.log('• Only simple spreadsheets with text content may work');
  console.log('• Complex formulas, charts, and formatting are not supported');
  console.log('• Many conversions will fail - this is expected behavior');
  console.log('• Recommended: Convert Excel files to CSV format first\n');
  
  await exampleWithFile();
  
  console.log('\n✨ Example completed!');
  console.log('\n💡 Alternative approach:');
  console.log('If conversion failed, try:');
  console.log('1. Open your Excel file');
  console.log('2. Save as CSV format');
  console.log('3. Use a text-to-markdown converter instead');
}

// Run example if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExample();
}

export { convertXlsxToMarkdown };