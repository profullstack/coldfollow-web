import * as XLSX from 'xlsx';
import { JSDOM } from 'jsdom';

/**
 * Service for generating Excel spreadsheets from HTML content
 */
export const excelService = {
  /**
   * Generate an Excel spreadsheet from HTML content containing tables
   * @param {string} html - The HTML content containing tables
   * @param {string} sheetName - The name for the worksheet (default: 'Sheet1')
   * @returns {Promise<Buffer>} - A buffer containing the Excel file data
   * @throws {Error} - If no tables are found in the HTML content
   */
  async generateExcel(html, sheetName = 'Sheet1') {
    // Create a DOM from the HTML
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Find all tables in the HTML
    const tables = document.querySelectorAll('table');
    
    if (tables.length === 0) {
      throw new Error('No tables found in the HTML content');
    }
    
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Process each table and add it as a sheet
    tables.forEach((table, index) => {
      // Convert table to worksheet
      const worksheet = XLSX.utils.table_to_sheet(table);
      
      // Add the worksheet to the workbook
      const currentSheetName = tables.length === 1 ? sheetName : `${sheetName}${index + 1}`;
      XLSX.utils.book_append_sheet(workbook, worksheet, currentSheetName);
    });
    
    // Write the workbook to a buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    return excelBuffer;
  }
};