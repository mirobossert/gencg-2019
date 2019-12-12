import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';

// `npm run build` -> `production` is true
// `npm run dev`   -> `production` is false
const production = !process.env.ROLLUP_WATCH;

const entries = [
  './_01-Shapes/01_02',
  './_01-Shapes/01_03',
  './_01-Shapes/01_04',
  './_01-Shapes/01_05',
  './_01-Shapes/01_06',
  './_02-Agents/02_01',
];

export default entries.map((path, index) => ({
  input: `${path}/src/index.js`,
  output: {
    file: `${path}/bundle.js`,
    format: 'iife', // immediately-invoked function expression — suitable for <script> tags
    sourcemap: false,
  },
  plugins: [
    resolve(), // tells Rollup how to find modules in node_modules
    commonjs(), // converts commonJs to ES6 modules
    json(), // converts .json files to ES6 modules
    production && terser() // minify, but only in production
  ]
}));