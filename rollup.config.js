export default {
  external: ['uv'],
  input: 'src/polyfills.js',
  output: {
    dir: 'dist',
    format: 'es',
    sourcemap: 'external',
  },
  treeshake: {
    pureExternalModules: true
  }
};
