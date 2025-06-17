import { docService } from '../services/doc-service.js';
import { storageService } from '../services/storage-service.js';
import { validateBody, validators } from '../middleware/error-handler.js';
import { errorUtils } from '../utils/error-utils.js';

/**
 * Route handler for converting HTML to Word document
 * @param {Object} c - Hono context
 * @returns {Response} - Word document file response
 */
export async function htmlToDocHandler(c) {
  try {
    const { html, filename = 'document.docx', store = false } = c.get('body');
    
    // Ensure filename has the correct extension
    const finalFilename = filename.endsWith('.docx') ? filename : filename.replace(/\.doc$|$/, '.docx');
    
    // Generate Word document from HTML - now returns a Promise
    const docBuffer = await docService.generateDoc(html);
    
    // Store the document in Supabase if requested
    if (store) {
      try {
        // Extract metadata from the request
        const metadata = {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          userAgent: c.req.header('user-agent'),
          timestamp: new Date().toISOString()
        };
        
        // Get user email from context
        const userEmail = c.get('userEmail');
        
        // Store the document with user association and original HTML content
        const result = await storageService.storeDoc(docBuffer, finalFilename, metadata, userEmail, html);
        
        // Add storage information to the response headers
        c.header('X-Storage-Path', result.path);
      } catch (storageError) {
        // Log the error but don't fail the request
        console.error('Error storing Word document in Supabase:', storageError);
      }
    }
    
    // Set response headers for .docx format
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    c.header('Content-Disposition', `attachment; filename="${finalFilename}"`);
    
    // Return the document buffer
    return c.body(docBuffer);
  } catch (error) {
    console.error('Error in HTML to DOC conversion:', error);
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route configuration for HTML to Word document endpoint
 */
export const htmlToDocRoute = {
  method: 'POST',
  path: '/api/1/html-to-doc',
  middleware: [validateBody(validators.htmlContent)],
  handler: htmlToDocHandler
};