import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

const execPromise = promisify(exec);

/**
 * Service for converting plain text files to Markdown content
 */
export const textToMarkdownService = {
  /**
   * Convert a plain text file to Markdown content using pandoc
   * @param {Buffer} textBuffer - The text file buffer to convert
   * @returns {Promise<string>} - A string containing the Markdown content
   */
  async convertToMarkdown(textBuffer) {
    try {
      // Create temporary files for input and output
      const tempDir = os.tmpdir();
      const inputId = uuidv4();
      const outputId = uuidv4();
      const inputPath = path.join(tempDir, `${inputId}.txt`);
      const outputPath = path.join(tempDir, `${outputId}.md`);
      
      // Write text buffer to temporary file
      await fs.promises.writeFile(inputPath, textBuffer);
      
      // Use pandoc to convert plain text to Markdown
      const command = `pandoc -f markdown -t markdown "${inputPath}" -o "${outputPath}"`;
      console.log(`Executing pandoc command: ${command}`);
      
      await execPromise(command);
      
      // Read the generated Markdown file
      const markdownContent = await fs.promises.readFile(outputPath, 'utf8');
      
      // Clean up temporary files
      try {
        await fs.promises.unlink(inputPath);
        await fs.promises.unlink(outputPath);
      } catch (cleanupError) {
        console.warn('Error cleaning up temporary files:', cleanupError);
      }
      
      return markdownContent;
    } catch (error) {
      console.error('Error converting text to Markdown with pandoc:', error);
      
      // If pandoc fails, provide a detailed error message
      if (error.stderr) {
        console.error('Pandoc error output:', error.stderr);
      }
      
      throw new Error(`Failed to convert text to Markdown: ${error.message}`);
    }
  }
};