const HTMLMinifier = require("html-minifier");
const CleanCSS = require("clean-css");
const UglifyES = require("uglify-es");
const MarkdownIt = require("markdown-it");

const markdownIt = MarkdownIt({
  html: true,
  breaks: true,
  linkify: true
});

module.exports = function(eleventyConfig) {
  eleventyConfig.setLibrary("md", markdownIt);

  eleventyConfig.addPassthroughCopy({
    "static/favicon": ".",
    "static/img": "img"
  });

  eleventyConfig.addTransform("minifyHTML", function(html, path) {
    if(path && path.endsWith(".html")) {
      return HTMLMinifier.minify(html, {
        collapseWhitespace: true,
        removeComments: true,
        useShortDoctype: true,
      });
    }
    return html;
  });

  eleventyConfig.addFilter("minifyCSS", function(code) {
    return new CleanCSS({}).minify(code).styles;
  });

  eleventyConfig.addFilter("minifyJS", function(code) {
    let minified = UglifyES.minify(code);
    if(minified.error) {
      console.log("UglifyES failed with an error: ", minified.error);
      throw new Error("Javascript minification failure");
    }
    return minified.code;
  });

  return {
    templateFormats: [
      "html",
      "md",
      "njk"
    ],

    pathPrefix: "",
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    passthroughFileCopy: true,
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "_site"
    }
  };
}
