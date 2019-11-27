import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

// `npm run build` -> `production` is true
// `npm run dev`   -> `production` is false
const production = !process.env.ROLLUP_WATCH;

export default {
  input: './_01-Shapes/01_04/src/index.js',
  output: {
    file: './_01-Shapes/01_04/bundle.js',
    format: 'iife', // immediately-invoked function expression — suitable for <script> tags
    sourcemap: true,
  },
  treeshake: false,
  plugins: [
    resolve(), // tells Rollup how to find modules in node_modules
    commonjs(), // converts commonJs to ES modules
    production && terser() // minify, but only in production
  ]
};
