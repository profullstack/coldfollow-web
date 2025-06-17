import { excelService } from '../services/excel-service.js';
import { storageService } from '../services/storage-service.js';
import { validateBody, validators } from '../middleware/error-handler.js';
import { errorUtils } from '../utils/error-utils.js';

/**
 * Route handler for converting HTML tables to Excel spreadsheet
 * @param {Object} c - Hono context
 * @returns {Response} - Excel file response
 */
export async function htmlToExcelHandler(c) {
  try {
    const { html, filename = 'document.xlsx', sheetName = 'Sheet1', store = false } = c.get('body');
    
    // Generate Excel spreadsheet from HTML tables
    const excelBuffer = await excelService.generateExcel(html, sheetName);
    
    // Store the Excel file in Supabase if requested
    if (store) {
      try {
        // Extract metadata from the request
        const metadata = {
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          sheetName,
          userAgent: c.req.header('user-agent'),
          timestamp: new Date().toISOString()
        };
        
        // Get user email from context
        const userEmail = c.get('userEmail');
        
        // Store the Excel file with user association and original HTML content
        const result = await storageService.storeExcel(excelBuffer, filename, metadata, userEmail, html);
        
        // Add storage information to the response headers
        c.header('X-Storage-Path', result.path);
      } catch (storageError) {
        // Log the error but don't fail the request
        console.error('Error storing Excel file in Supabase:', storageError);
      }
    }
    
    // Set response headers
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Return the Excel buffer
    return c.body(excelBuffer);
  } catch (error) {
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route configuration for HTML to Excel endpoint
 */
export const htmlToExcelRoute = {
  method: 'POST',
  path: '/api/1/html-to-excel',
  middleware: [validateBody(validators.htmlContent)],
  handler: htmlToExcelHandler
};