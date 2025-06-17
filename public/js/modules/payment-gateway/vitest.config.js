import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    bail: 1, // Stop after first test failure
    environment: 'node',
    include: ['test/**/*.test.js'],
    testTimeout: 10000, // Increase timeout to 10 seconds
  },
});
