import { marked } from 'marked';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

const execPromise = promisify(exec);

/**
 * Service for converting between Markdown and HTML
 */
export const markdownService = {
  /**
   * Convert Markdown to HTML
   * @param {string} markdown - The Markdown content to convert
   * @param {Object} options - Options for the marked library
   * @returns {string} - The HTML content
   */
  markdownToHtml(markdown, options = {}) {
    // Configure marked options
    const markedOptions = {
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // Convert line breaks to <br>
      headerIds: true, // Add IDs to headers
      ...options
    };

    // Convert markdown to HTML
    const html = marked(markdown, markedOptions);
    
    return html;
  },

  /**
   * Convert HTML to Markdown using pandoc
   * @param {string} html - The HTML content to convert
   * @param {Object} options - Options for pandoc conversion
   * @returns {Promise<string>} - The Markdown content
   */
  async htmlToMarkdown(html, options = {}) {
    try {
      // Create temporary files for input and output
      const tempDir = os.tmpdir();
      const inputId = uuidv4();
      const outputId = uuidv4();
      const inputPath = path.join(tempDir, `${inputId}.html`);
      const outputPath = path.join(tempDir, `${outputId}.md`);
      
      // Write HTML to temporary file
      await fs.promises.writeFile(inputPath, html, 'utf8');
      
      // Use pandoc to convert HTML to Markdown
      const command = `pandoc -f html -t markdown_github "${inputPath}" -o "${outputPath}"`;
      console.log(`Executing pandoc command: ${command}`);
      
      await execPromise(command);
      
      // Read the generated Markdown file
      const markdown = await fs.promises.readFile(outputPath, 'utf8');
      
      // Clean up temporary files
      try {
        await fs.promises.unlink(inputPath);
        await fs.promises.unlink(outputPath);
      } catch (cleanupError) {
        console.warn('Error cleaning up temporary files:', cleanupError);
      }
      
      return markdown;
    } catch (error) {
      console.error('Error converting HTML to Markdown with pandoc:', error);
      
      // If pandoc fails, provide a detailed error message
      if (error.stderr) {
        console.error('Pandoc error output:', error.stderr);
      }
      
      throw new Error(`Failed to convert HTML to Markdown: ${error.message}`);
    }
  }
};