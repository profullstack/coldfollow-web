import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

const execPromise = promisify(exec);

/**
 * Service for converting EPUB files to Markdown content
 */
export const epubToMarkdownService = {
  /**
   * Convert an EPUB file to Markdown content using pandoc
   * @param {Buffer} epubBuffer - The EPUB file buffer to convert
   * @returns {Promise<string>} - A string containing the Markdown content
   */
  async convertToMarkdown(epubBuffer) {
    try {
      // Create temporary files for input and output
      const tempDir = os.tmpdir();
      const inputId = uuidv4();
      const outputId = uuidv4();
      const inputPath = path.join(tempDir, `${inputId}.epub`);
      const outputPath = path.join(tempDir, `${outputId}.md`);
      
      // Write EPUB buffer to temporary file
      await fs.promises.writeFile(inputPath, epubBuffer);
      
      // Use pandoc to convert EPUB to Markdown
      const command = `pandoc -f epub -t markdown "${inputPath}" -o "${outputPath}"`;
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
      console.error('Error converting EPUB to Markdown with pandoc:', error);
      
      // If pandoc fails, provide a detailed error message
      if (error.stderr) {
        console.error('Pandoc error output:', error.stderr);
      }
      
      throw new Error(`Failed to convert EPUB to Markdown: ${error.message}`);
    }
  }
};