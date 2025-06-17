# Document-to-Markdown Examples

This directory contains example scripts demonstrating how to use each of the document-to-markdown conversion endpoints.

## Available Examples

### Individual Format Examples

1. **[`pdf-to-markdown-example.js`](pdf-to-markdown-example.js)** - Convert PDF files to Markdown
2. **[`docx-to-markdown-example.js`](docx-to-markdown-example.js)** - Convert DOCX files to Markdown
3. **[`doc-to-markdown-example.js`](doc-to-markdown-example.js)** - Convert legacy DOC files to Markdown
4. **[`epub-to-markdown-example.js`](epub-to-markdown-example.js)** - Convert EPUB e-books to Markdown
5. **[`text-to-markdown-example.js`](text-to-markdown-example.js)** - Convert plain text files to Markdown
6. **[`pptx-to-markdown-example.js`](pptx-to-markdown-example.js)** - Convert PowerPoint presentations to Markdown ⚠️
7. **[`xlsx-to-markdown-example.js`](xlsx-to-markdown-example.js)** - Convert Excel spreadsheets to Markdown ⚠️

### Comprehensive Example

- **[`test-document-to-markdown-endpoints.js`](test-document-to-markdown-endpoints.js)** - Test all endpoints in one script

## Quick Start

### Prerequisites

1. **Authentication Token**: Replace `YOUR_AUTH_TOKEN` in any example with a valid bearer token
2. **Server Running**: Ensure the convert2doc server is running (usually on port 3000)
3. **Sample Files**: Place sample files in the examples directory or update the file paths in the scripts

### Running an Example

```bash
# Run a specific format example
node examples/pdf-to-markdown-example.js

# Run the comprehensive test
node examples/test-document-to-markdown-endpoints.js
```

### Using as Modules

All examples export their main conversion functions and can be imported:

```javascript
import { convertPdfToMarkdown } from './examples/pdf-to-markdown-example.js';

const markdownContent = await convertPdfToMarkdown(pdfBase64, 'document.pdf');
```

## Format Support & Limitations

### ✅ Fully Supported Formats

- **PDF** - Reliable text extraction, layout may be lost
- **DOCX** - Excellent support, formatting preserved
- **DOC** - Good support for legacy Word documents
- **EPUB** - Great for e-books, chapter structure preserved
- **Text** - Perfect conversion, paragraph structure maintained

### ⚠️ Limited Support Formats

- **PPTX** - Text-only extraction, no layout/images
- **XLSX** - Experimental, often fails, use CSV instead

## Example File Structure

Each individual example follows this pattern:

```javascript
// Sample base64 content
const sampleFileBase64 = '...';

// Main conversion function
async function convertFileToMarkdown(fileBase64, filename, store = false) {
  // API call implementation
}

// File reading example
async function exampleWithFile() {
  // Read file and convert
}

// Main runner
async function runExample() {
  // Setup instructions and execution
}

// Export for module use
export { convertFileToMarkdown };
```

## Configuration

### API Base URL

Update the `API_BASE_URL` constant in each example:

```javascript
const API_BASE_URL = 'http://localhost:3000'; // Change as needed
```

### Authentication

There are two ways to authenticate with the API:

1. **JWT Tokens** - Use the Authorization header with Bearer prefix:

```javascript
'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
```

2. **API Keys** - Use the X-API-Key header:

```javascript
'X-API-Key': 'YOUR_API_KEY_HERE'  // API keys start with 'pfs_'
```

> **Important**: API keys should be sent in the X-API-Key header, not in the Authorization header.

### File Paths

Update file paths to point to your actual documents:

```javascript
const filePath = './your-actual-document.pdf';
```

## Error Handling

All examples include comprehensive error handling:

- Network errors
- Authentication failures
- Conversion failures
- File system errors

## Output

Each example will:

1. Display conversion progress
2. Save the converted Markdown to a file
3. Show a preview of the converted content
4. Provide helpful error messages if conversion fails

## Tips for Success

### For PowerPoint (PPTX)
- Only text content will be extracted
- Consider converting to PDF first for layout preservation
- Slide structure may become headings

### For Excel (XLSX)
- Conversion often fails - this is expected
- Convert to CSV format first for better results
- Only simple spreadsheets may work

### For All Formats
- Ensure files are not corrupted
- Check file permissions
- Verify the server is running and accessible
- Use valid authentication tokens

## Troubleshooting

### Common Issues

1. **Authentication Error**:
   - For JWT tokens: Ensure your token is valid and sent in the Authorization header
   - For API keys: Make sure to use the X-API-Key header (not Authorization) for API keys
   - API keys should start with 'pfs_' and be sent without any 'Bearer' prefix
2. **Server Connection**: Verify the API_BASE_URL and server status
3. **File Not Found**: Check file paths and permissions
4. **Conversion Failed**: Some formats have limitations (see above)

### Getting Help

- Check the main documentation: [`README-document-to-markdown-endpoints.md`](../README-document-to-markdown-endpoints.md)
- Review server logs for detailed error messages
- Ensure pandoc is installed on the server

## Contributing

When adding new examples:

1. Follow the established pattern
2. Include comprehensive error handling
3. Add format-specific limitations and tips
4. Update this README with the new example
5. Export the main conversion function for module use