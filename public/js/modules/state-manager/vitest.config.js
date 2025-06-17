import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.js'],
    bail: 1, // Stop on first failure as requested
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/']
    }
  }
});