import * as esbuild from 'esbuild';

// Bundle deps.js to make Node modules work in the browser
async function buildDeps() {
  try {
    const result = await esbuild.build({
      entryPoints: ['public/js/deps.js'],
      bundle: true,
      format: 'esm',
      outfile: 'public/js/deps.bundled.js',
      sourcemap: true,
      minify: false,
      target: ['es2020'],
      loader: { '.js': 'jsx' },
    });

    console.log('Build successful:', result);
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildDeps();
