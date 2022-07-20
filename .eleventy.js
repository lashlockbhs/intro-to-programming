module.exports = function eleventyConfig(eleventyConfig) {
  eleventyConfig.addWatchTarget('./src/js/')

  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("src/**/*.css");
  eleventyConfig.addPassthroughCopy("src/**/*.js");
  eleventyConfig.addPassthroughCopy("src/**/*.json");
  eleventyConfig.addPassthroughCopy("src/**/*.txt");

  return {
    dir: {
      input: "src",
      output: "_site"
    },
    templateFormats: ['md', '11ty.js', 'html']
  }
}
