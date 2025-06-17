import { textToMarkdownService } from '../services/text-to-markdown-service.js';
import { storageService } from '../services/storage-service.js';
import { validateBody, validators } from '../middleware/error-handler.js';
import { errorUtils } from '../utils/error-utils.js';

/**
 * Route handler for converting text to Markdown
 * @param {Object} c - Hono context
 * @returns {Response} - Markdown content response
 */
export async function textToMarkdownHandler(c) {
  try {
    const { file, filename, store = false } = c.get('body');
    
    // Convert base64 file content to buffer
    const fileBuffer = Buffer.from(file, 'base64');
    
    // Ensure filename has the correct extension for output
    const outputFilename = filename.replace(/\.txt$/i, '.md');
    
    // Convert text to Markdown using pandoc
    const markdownContent = await textToMarkdownService.convertToMarkdown(fileBuffer);
    
    // Store the document in Supabase if requested
    if (store) {
      try {
        // Extract metadata from the request
        const metadata = {
          contentType: 'text/markdown',
          userAgent: c.req.header('user-agent'),
          timestamp: new Date().toISOString(),
          originalFormat: 'text'
        };
        
        // Get user email from context
        const userEmail = c.get('userEmail');
        
        // Store the markdown content with user association and original filename
        const markdownBuffer = Buffer.from(markdownContent, 'utf8');
        const result = await storageService.storeDoc(markdownBuffer, outputFilename, metadata, userEmail, null);
        
        // Add storage information to the response headers
        c.header('X-Storage-Path', result.path);
      } catch (storageError) {
        // Log the error but don't fail the request
        console.error('Error storing Markdown document in Supabase:', storageError);
      }
    }
    
    // Set response headers for markdown format
    c.header('Content-Type', 'text/markdown; charset=utf-8');
    c.header('Content-Disposition', `attachment; filename="${outputFilename}"`);
    
    // Return the markdown content
    return c.text(markdownContent);
  } catch (error) {
    console.error('Error in text to Markdown conversion:', error);
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route configuration for text to Markdown endpoint
 */
export const textToMarkdownRoute = {
  method: 'POST',
  path: '/api/1/text-to-markdown',
  middleware: [validateBody(validators.textFileContent)],
  handler: textToMarkdownHandler
};