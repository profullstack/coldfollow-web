import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  // Ensure named exports are preserved
  treeshake: false,
  // Add explicit exports to ensure they're preserved
  esbuildOptions(options) {
    options.banner = {
      js: `
/**
 * @profullstack/localizer
 * A simple localization and internationalization library with RTL support
 */
`,
    };
  },
});