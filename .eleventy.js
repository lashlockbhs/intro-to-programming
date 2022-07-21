const pageDirs = [
  'assignments',
  'calendar',
  'demo',
];

const extensions = [
  'css',
  'js',
  'json',
  'txt',
];

module.exports = function eleventyConfig(eleventyConfig) {
  eleventyConfig.addWatchTarget('./js/')

  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("favicon.ico");

  // Copy through content used by iframes
  pageDirs.forEach((dir) => {
    extensions.forEach((ext) => {
      eleventyConfig.addPassthroughCopy(`${dir}/**/*.${ext}`);
    })
  });

  return {
    dir: {
      input: ".",
      output: "_site"
    },
    templateFormats: ['md', '11ty.js', 'html']
  }
}
