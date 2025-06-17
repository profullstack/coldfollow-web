import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default [
  // ESM build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      resolve(),
    ]
  },
  // ESM minified build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.esm.min.js',
      format: 'esm',
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      resolve(),
      terser()
    ]
  },
  // UMD build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.js',
      format: 'umd',
      name: 'ProfullstackSpaRouter',
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      resolve(),
    ]
  },
  // UMD minified build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.min.js',
      format: 'umd',
      name: 'ProfullstackSpaRouter',
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      resolve(),
      terser()
    ]
  }
];