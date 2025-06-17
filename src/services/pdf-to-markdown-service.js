import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

const execPromise = promisify(exec);

/**
 * Service for converting PDF files to Markdown content
 */
export const pdfToMarkdownService = {
  /**
   * Convert a PDF file to Markdown content using a two-step process:
   * 1. First convert PDF to text using pdftotext
   * 2. Then convert text to Markdown using pandoc
   *
   * This approach provides better results than direct PDF to Markdown conversion
   * since pandoc doesn't handle PDF input very well.
   *
   * @param {Buffer} pdfBuffer - The PDF file buffer to convert
   * @returns {Promise<string>} - A string containing the Markdown content
   */
  async convertToMarkdown(pdfBuffer) {
    try {
      // Create temporary files for input, intermediate text, and final output
      const tempDir = os.tmpdir();
      const inputId = uuidv4();
      const textId = uuidv4();
      const outputId = uuidv4();
      const inputPath = path.join(tempDir, `${inputId}.pdf`);
      const textPath = path.join(tempDir, `${textId}.txt`);
      const outputPath = path.join(tempDir, `${outputId}.md`);
      
      // Write PDF buffer to temporary file
      await fs.promises.writeFile(inputPath, pdfBuffer);
      
      // Step 1: Use pdftotext to convert PDF to text
      const pdftotextCommand = `pdftotext "${inputPath}" "${textPath}"`;
      console.log(`Executing pdftotext command: ${pdftotextCommand}`);
      
      await execPromise(pdftotextCommand);
      
      // Step 2: Use pandoc to convert text to Markdown
      const pandocCommand = `pandoc -f markdown -t markdown "${textPath}" -o "${outputPath}"`;
      console.log(`Executing pandoc command: ${pandocCommand}`);
      
      await execPromise(pandocCommand);
      
      // Read the generated Markdown file
      const markdownContent = await fs.promises.readFile(outputPath, 'utf8');
      
      // Clean up temporary files
      try {
        await fs.promises.unlink(inputPath);
        await fs.promises.unlink(textPath);
        await fs.promises.unlink(outputPath);
      } catch (cleanupError) {
        console.warn('Error cleaning up temporary files:', cleanupError);
      }
      
      return markdownContent;
    } catch (error) {
      console.error('Error in PDF to Markdown conversion process:', error);
      
      // Provide detailed error output
      if (error.stderr) {
        console.error('Command error output:', error.stderr);
      }
      
      throw new Error(`Failed to convert PDF to Markdown: ${error.message}`);
    }
  }
};