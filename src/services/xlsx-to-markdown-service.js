import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';
import { read, utils } from 'xlsx/xlsx.mjs';

const execPromise = promisify(exec);

/**
 * Service for converting XLSX files to Markdown content
 */
export const xlsxToMarkdownService = {
  /**
   * Convert an XLSX file to Markdown content by first converting to CSV
   * and then using pandoc to convert CSV to Markdown
   * @param {Buffer} xlsxBuffer - The XLSX file buffer to convert
   * @returns {Promise<string>} - A string containing the Markdown content
   */
  async convertToMarkdown(xlsxBuffer) {
    try {
      // Create temporary directory for our files
      const tempDir = os.tmpdir();
      const inputId = uuidv4();
      const inputPath = path.join(tempDir, `${inputId}.xlsx`);
      
      // Write XLSX buffer to temporary file
      await fs.promises.writeFile(inputPath, xlsxBuffer);
      
      // Read the workbook using xlsx package
      const buffer = await fs.promises.readFile(inputPath);
      const workbook = read(buffer);
      
      // Array to store markdown content from each sheet
      const markdownParts = [];
      
      // Process each sheet in the workbook
      for (const sheetName of workbook.SheetNames) {
        console.log(`Processing sheet: ${sheetName}`);
        
        // Get the worksheet
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert worksheet to CSV
        const csvContent = utils.sheet_to_csv(worksheet);
        
        // Create temporary files for CSV and Markdown
        const csvId = uuidv4();
        const mdId = uuidv4();
        const csvPath = path.join(tempDir, `${csvId}.csv`);
        const mdPath = path.join(tempDir, `${mdId}.md`);
        
        // Write CSV content to file
        await fs.promises.writeFile(csvPath, csvContent);
        
        // Use pandoc to convert CSV to Markdown
        const command = `pandoc -f csv -t markdown "${csvPath}" -o "${mdPath}"`;
        console.log(`Executing pandoc command: ${command}`);
        
        await execPromise(command);
        
        // Read the generated Markdown file
        const sheetMarkdown = await fs.promises.readFile(mdPath, 'utf8');
        
        // Add sheet name as header and append to markdown parts
        markdownParts.push(`# ${sheetName}\n\n${sheetMarkdown}\n\n`);
        
        // Clean up temporary CSV and MD files
        try {
          await fs.promises.unlink(csvPath);
          await fs.promises.unlink(mdPath);
        } catch (cleanupError) {
          console.warn('Error cleaning up temporary files:', cleanupError);
        }
      }
      
      // Clean up the input XLSX file
      try {
        await fs.promises.unlink(inputPath);
      } catch (cleanupError) {
        console.warn('Error cleaning up input file:', cleanupError);
      }
      
      // Combine all markdown parts
      return markdownParts.join('---\n\n');
    } catch (error) {
      console.error('Error converting XLSX to Markdown:', error);
      
      throw new Error(`Failed to convert XLSX to Markdown: ${error.message}`);
    }
  }
};