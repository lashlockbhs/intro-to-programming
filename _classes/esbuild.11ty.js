const fs = require('fs');
const esbuild = require('esbuild');
const { NODE_ENV = 'production' } = process.env;

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
      eleventyExcludeFromCollections: true,
    };
  }

  async render(data) {
    // Build our own JS code.
    const jsFiles = await fs.promises
      .readdir('js')
      .then((files) => files.filter((f) => f.endsWith('.js')));

    await esbuild.build({
      entryPoints: jsFiles.map((f) => `js/${f}`),
      bundle: true,
      loader: {
        '.ttf': 'file',
      },
      minify: false,
      outdir: `${data.eleventyConfig.dir.output}/js`,
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
      outdir: `${data.eleventyConfig.dir.output}/js`,
      outbase: './node_modules/monaco-editor/esm/',
      sourcemap: true,
      target: 'es6',
    });
  }
};
