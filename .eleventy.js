module.exports = function eleventyConfig(eleventyConfig) {
  eleventyConfig.addWatchTarget('./js/')

  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("src/**/*.css");
  eleventyConfig.addPassthroughCopy("src/**/*.json");
  eleventyConfig.addPassthroughCopy("src/**/*.txt");
  eleventyConfig.addPassthroughCopy("src/**/*.js");
  eleventyConfig.addPassthroughCopy("src/favicon.ico");

  return {
    dir: {
      input: ".",
      output: "_site"
    },
    templateFormats: ['md', '11ty.js', 'html']
  }
}
