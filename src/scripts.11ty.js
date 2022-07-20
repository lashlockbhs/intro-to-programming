const esbuild = require('esbuild')
const { NODE_ENV = 'production' } = process.env

const INPUT = 'src'; // has to match dir.input in .eleventy.js
const OUTPUT = '_site'; // has to match dir.output in .eleventy.js

const JS_FILES = [
  'calendar-builder.js',
  'github-test.js',
  'index.js',
  'new-repl.js',
  'test-repo-create.js',
];

const isProduction = NODE_ENV === 'production'

module.exports = class {
  data() {
    return {
      permalink: false,
      eleventyExcludeFromCollections: true
    }
  }

  async render(data) {
    await esbuild.build({
      entryPoints: JS_FILES.map((f) => `${INPUT}/js/${f}`),
      bundle: true,
      loader: {
        '.ttf': 'file',
      },
      minify: isProduction,
      outdir: `${OUTPUT}/js`,
      sourcemap: true, // !isProduction,
      target: 'es6',
    })
  }
}
