module.exports = function eleventyConfig(eleventyConfig) {
  eleventyConfig.addWatchTarget('./src/js/')

  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("src/**/*.css");
  eleventyConfig.addPassthroughCopy("src/**/*.json");
  eleventyConfig.addPassthroughCopy("src/**/*.txt");
  eleventyConfig.addPassthroughCopy("src/demo/**/*.js");
  eleventyConfig.addPassthroughCopy("src/assignments/**/*.js");
  eleventyConfig.addPassthroughCopy("src/favicon.ico");

  // Temporary kludge to get old js-games working without too much change.
  eleventyConfig.addPassthroughCopy("src/games/**/*.js");
  eleventyConfig.addPassthroughCopy("src/games/**/*.svg");


  return {
    dir: {
      input: "src",
      output: "_site"
    },
    templateFormats: ['md', '11ty.js', 'html']
  }
}
