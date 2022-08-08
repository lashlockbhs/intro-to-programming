const pageDirs = ['assignments', 'calendar', 'demo', 'expressions'];

const extensions = ['css', 'js', 'json', 'txt'];

module.exports = function eleventyConfig(eleventyConfig) {
  // Hack to make our configured output dir available to class-based templates.
  eleventyConfig.addPlugin((ec) => ec.addGlobalData('eleventyConfig', ec));

  eleventyConfig.addWatchTarget('./js/');

  eleventyConfig.addPassthroughCopy('css');
  eleventyConfig.addPassthroughCopy('img');
  eleventyConfig.addPassthroughCopy('reveal');
  eleventyConfig.addPassthroughCopy('favicon.ico');

  // Copy through content used by iframes
  pageDirs.forEach((dir) => {
    extensions.forEach((ext) => {
      eleventyConfig.addPassthroughCopy(`${dir}/**/*.${ext}`);
    });
  });

  return {
    dir: {
      input: '.',
      includes: '_includes',
      layouts: '_layouts',
      output: '_site',
    },
    templateFormats: ['11ty.js', 'html'],
  };
};
