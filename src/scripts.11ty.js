const esbuild = require('esbuild');
const { NODE_ENV = 'production' } = process.env;

const INPUT = 'src'; // has to match dir.input in .eleventy.js
const OUTPUT = '_site'; // has to match dir.output in .eleventy.js

const JS_FILES = [
  'calendar-builder.js',
  'github-test.js',
  'index.js',
  'new-repl.js',
  'test-repo-create.js',
];

const monaco_workers = [
  'vs/editor/editor.worker.js',
  'vs/language/css/css.worker.js',
  'vs/language/html/html.worker.js',
  'vs/language/json/json.worker.js',
  'vs/language/typescript/ts.worker.js',
];

const isProduction = NODE_ENV === 'production';

module.exports = class {
  data() {
    return {
      permalink: false,
      eleventyExcludeFromCollections: true
    }
  }

  async render(data) {

    // Build our own JS code.
    await esbuild.build({
      entryPoints: JS_FILES.map((f) => `${INPUT}/js/${f}`),
      bundle: true,
      loader: {
        '.ttf': 'file',
      },
      minify: true,
      outdir: `${OUTPUT}/js`,
      sourcemap: true,
      target: 'es6',
    });

    // Build the dynamically loaded Monaco worker code.
    await esbuild.build({
      entryPoints: monaco_workers.map((f) => `node_modules/monaco-editor/esm/${f}`),
      bundle: true,
      loader: {
        '.ttf': 'file',
      },
      minify: true,
      outdir: `${OUTPUT}/js`,
      outbase: './node_modules/monaco-editor/esm/',
      sourcemap: true,
      target: 'es6',
    });
  }
};
