# Document to Markdown Endpoints

This document describes the implemented endpoints for converting various document formats to Markdown.

## Endpoints

### PDF to Markdown
- **URL**: `/api/1/pdf-to-markdown`
- **Method**: `POST`
- **Authentication**: Required (Bearer token)

### DOCX to Markdown
- **URL**: `/api/1/docx-to-markdown`
- **Method**: `POST`
- **Authentication**: Required (Bearer token)

### DOC to Markdown
- **URL**: `/api/1/doc-to-markdown`
- **Method**: `POST`
- **Authentication**: Required (Bearer token)

### EPUB to Markdown
- **URL**: `/api/1/epub-to-markdown`
- **Method**: `POST`
- **Authentication**: Required (Bearer token)

### Text to Markdown
- **URL**: `/api/1/text-to-markdown`
- **Method**: `POST`
- **Authentication**: Required (Bearer token)

### PPTX to Markdown
- **URL**: `/api/1/pptx-to-markdown`
- **Method**: `POST`
- **Authentication**: Required (Bearer token)

### XLSX to Markdown
- **URL**: `/api/1/xlsx-to-markdown`
- **Method**: `POST`
- **Authentication**: Required (Bearer token)

### HTML to Markdown (Existing)
- **URL**: `/api/1/html-to-markdown`
- **Method**: `POST`
- **Authentication**: Required (Bearer token)

## Request Format

All endpoints expect a JSON payload with the following structure:

```json
{
  "file": "base64-encoded-file-content",
  "filename": "original-filename.pdf", // or .docx, .doc, .epub, .txt, .pptx, .xlsx
  "store": false // optional, defaults to false
}
```

### Parameters

- **file** (required): Base64-encoded content of the document file
- **filename** (required): Original filename with appropriate extension (.pdf, .docx, .doc, .epub, .txt, .pptx, .xlsx)
- **store** (optional): Boolean flag to store the converted document in Supabase storage

## Response Format

### Success Response
- **Content-Type**: `text/markdown; charset=utf-8`
- **Content-Disposition**: `attachment; filename="converted-filename.md"`
- **Body**: The converted Markdown content as plain text

### Error Response
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## Implementation Details

### Services
- **pdf-to-markdown-service.js**: Handles PDF to Markdown conversion using pandoc
- **docx-to-markdown-service.js**: Handles DOCX to Markdown conversion using pandoc
- **doc-to-markdown-service.js**: Handles DOC to Markdown conversion using pandoc
- **epub-to-markdown-service.js**: Handles EPUB to Markdown conversion using pandoc
- **text-to-markdown-service.js**: Handles text to Markdown conversion using pandoc
- **pptx-to-markdown-service.js**: Handles PPTX to Markdown conversion using pandoc
- **xlsx-to-markdown-service.js**: Handles XLSX to Markdown conversion using pandoc

### Routes
- **pdf-to-markdown.js**: Route handler for PDF conversion endpoint
- **docx-to-markdown.js**: Route handler for DOCX conversion endpoint
- **doc-to-markdown.js**: Route handler for DOC conversion endpoint
- **epub-to-markdown.js**: Route handler for EPUB conversion endpoint
- **text-to-markdown.js**: Route handler for text conversion endpoint
- **pptx-to-markdown.js**: Route handler for PPTX conversion endpoint
- **xlsx-to-markdown.js**: Route handler for XLSX conversion endpoint
- **html-to-markdown.js**: Route handler for HTML conversion endpoint (existing)

### Validation
- **pdfFileContent**: Validates PDF file upload requests
- **docxFileContent**: Validates DOCX file upload requests
- **docFileContent**: Validates DOC file upload requests
- **epubFileContent**: Validates EPUB file upload requests
- **textFileContent**: Validates text file upload requests
- **pptxFileContent**: Validates PPTX file upload requests
- **xlsxFileContent**: Validates XLSX file upload requests

## Usage Examples

### Converting a PDF file

```javascript
const pdfFile = // ... get file as base64
const response = await fetch('/api/1/pdf-to-markdown', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    file: pdfFile,
    filename: 'document.pdf',
    store: false
  })
});

const markdownContent = await response.text();
```

### Converting a DOCX file

```javascript
const docxFile = // ... get file as base64
const response = await fetch('/api/1/docx-to-markdown', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    file: docxFile,
    filename: 'document.docx',
    store: true // Store in Supabase
  })
});

const markdownContent = await response.text();
```

## Testing

A test/example script is available at [`examples/test-document-to-markdown-endpoints.js`](examples/test-document-to-markdown-endpoints.js) that demonstrates how to use both endpoints.

To run the example:
```bash
node examples/test-document-to-markdown-endpoints.js
```

Note: You'll need to update the script with valid authentication tokens and actual file content for testing.

## Dependencies

- **pandoc**: Used for file conversion (must be installed on the server)
- **fs**: File system operations for temporary file handling
- **uuid**: Generating unique temporary file names
- **os**: Operating system utilities for temporary directory access

## Format Support Limitations

### PowerPoint (PPTX) Support
- Pandoc can extract text content from PPTX files but layout information is lost
- Slide structure may be preserved as headings in the markdown output
- Images, animations, and complex formatting are not converted

### Excel (XLSX) Support
- **Limited Support**: Pandoc's XLSX support is experimental and may not work reliably
- Simple spreadsheets with text content may convert successfully
- Complex formulas, charts, and formatting are not supported
- Consider converting Excel files to CSV format for better results

### Recommended Alternatives
- For Excel files: Convert to CSV format first for more reliable conversion
- For PowerPoint files: Export as PDF first if layout preservation is important

## Error Handling

The endpoints handle various error scenarios:
- Invalid file format
- Missing required parameters
- Pandoc conversion failures
- File system errors
- Storage service errors (when store=true)

All errors are logged with appropriate context and return meaningful error messages to the client.

## Security Considerations

- All endpoints require authentication
- Temporary files are automatically cleaned up after processing
- File content is validated before processing
- Error messages don't expose sensitive system information