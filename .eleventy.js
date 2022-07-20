module.exports = function eleventyConfig(eleventyConfig) {
  eleventyConfig.addWatchTarget('./js/')

  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("src/**/*.css");
  eleventyConfig.addPassthroughCopy("src/**/*.json");
  eleventyConfig.addPassthroughCopy("src/**/*.txt");
  eleventyConfig.addPassthroughCopy("src/**/*.js");
  eleventyConfig.addPassthroughCopy("src/favicon.ico");

  // Temporary kludge to get old js-games working without too much change.
  eleventyConfig.addPassthroughCopy("src/games/**/*.svg");


  return {
    dir: {
      input: "src",
      output: "_site"
    },
    templateFormats: ['md', '11ty.js', 'html']
  }
}
