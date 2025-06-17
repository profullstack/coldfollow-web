import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

const execPromise = promisify(exec);

/**
 * Service for generating PowerPoint presentations from HTML content
 */
export const pptService = {
  /**
   * Generate a PowerPoint presentation from HTML content using pandoc
   * @param {string} html - The HTML content to convert to PowerPoint
   * @param {string} title - The title for the presentation
   * @returns {Promise<Buffer>} - A buffer containing the PowerPoint file data
   */
  async generatePpt(html, title = 'Presentation') {
    try {
      // Create temporary files for input and output
      const tempDir = os.tmpdir();
      const inputId = uuidv4();
      const outputId = uuidv4();
      const inputPath = path.join(tempDir, `${inputId}.html`);
      const outputPath = path.join(tempDir, `${outputId}.pptx`);
      
      // Write HTML to temporary file
      await fs.promises.writeFile(inputPath, html, 'utf8');
      
      // Build the pandoc command with options
      let command = `pandoc -f html -t pptx "${inputPath}" -o "${outputPath}"`;
      
      // Add title if provided
      if (title) {
        command += ` --metadata title="${title}"`;
      }
      
      console.log(`Executing pandoc command: ${command}`);
      
      // Execute pandoc command
      const { stderr } = await execPromise(command);
      
      if (stderr && !stderr.includes('WARNING')) {
        throw new Error(`Pandoc error: ${stderr}`);
      }
      
      // Read the generated PPTX file
      const pptBuffer = await fs.promises.readFile(outputPath);
      
      // Clean up temporary files
      try {
        await fs.promises.unlink(inputPath);
        await fs.promises.unlink(outputPath);
      } catch (cleanupError) {
        console.warn('Error cleaning up temporary files:', cleanupError);
      }
      
      return pptBuffer;
    } catch (error) {
      console.error('Error generating PowerPoint with pandoc:', error);
      
      // If pandoc fails, provide a detailed error message
      if (error.stderr) {
        console.error('Pandoc error output:', error.stderr);
      }
      
      throw new Error(`Failed to generate PowerPoint: ${error.message}`);
    }
  }
};