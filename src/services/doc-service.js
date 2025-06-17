import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

const execPromise = promisify(exec);

/**
 * Service for generating Word documents from HTML content
 */
export const docService = {
  /**
   * Generate a Word document from HTML content using pandoc
   * @param {string} html - The HTML content to convert to Word format
   * @returns {Promise<Buffer>} - A buffer containing the Word document data
   */
  async generateDoc(html) {
    try {
      // Create temporary files for input and output
      const tempDir = os.tmpdir();
      const inputId = uuidv4();
      const outputId = uuidv4();
      const inputPath = path.join(tempDir, `${inputId}.html`);
      const outputPath = path.join(tempDir, `${outputId}.docx`);
      
      // Write HTML to temporary file
      await fs.promises.writeFile(inputPath, html, 'utf8');
      
      // Use pandoc to convert HTML to DOCX
      const command = `pandoc -f html -t docx "${inputPath}" -o "${outputPath}"`;
      console.log(`Executing pandoc command: ${command}`);
      
      await execPromise(command);
      
      // Read the generated DOCX file
      const docBuffer = await fs.promises.readFile(outputPath);
      
      // Clean up temporary files
      try {
        await fs.promises.unlink(inputPath);
        await fs.promises.unlink(outputPath);
      } catch (cleanupError) {
        console.warn('Error cleaning up temporary files:', cleanupError);
      }
      
      return docBuffer;
    } catch (error) {
      console.error('Error generating Word document with pandoc:', error);
      
      // If pandoc fails, provide a detailed error message
      if (error.stderr) {
        console.error('Pandoc error output:', error.stderr);
      }
      
      throw new Error(`Failed to generate Word document: ${error.message}`);
    }
  }
};