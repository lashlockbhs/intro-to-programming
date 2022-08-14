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
    const baseBuildConfig = {
      bundle: true,
      loader: { '.ttf': 'file' },
      outdir: `${data.eleventyConfig.dir.output}/js`,
      sourcemap: true,
      target: 'es6',
    };

    // Build our own JS code.
    const jsFiles = await fs.promises
      .readdir('js')
      .then((files) => files.filter((f) => f.endsWith('.js')));

    await esbuild.build({
      ...baseBuildConfig,
      entryPoints: jsFiles.map((f) => `js/${f}`),
      minify: false,
    });

    // Build the dynamically loaded Monaco worker code.
    await esbuild.build({
      ...baseBuildConfig,
      entryPoints: monaco_workers.map((f) => `node_modules/monaco-editor/esm/${f}`),
      minify: true,
      outbase: './node_modules/monaco-editor/esm/',
    });
  }
};
