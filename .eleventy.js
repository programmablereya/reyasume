const HTMLMinifier = require("html-minifier");
const CleanCSS = require("clean-css");
const UglifyES = require("uglify-es");
const MarkdownIt = require("markdown-it");
const JSYaml = require("js-yaml");
require('intl');

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

  eleventyConfig.addFilter("monthAndYear", function(date) {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short"
    });
  });

  // Creates a child object with a new or overridden property without affecting
  // the original.
  function inheritAndAdd(base, newProperties) {
    return Object.assign(Object.create(base), newProperties);
  }

  // Identifies highlights in this array.
  //
  // itemList is an array of objects with "id" (string) properties
  // filter is a specification for how to filter this list, which can be:
  // * true or "all", in which case all items are highlights
  // * some falsy value, in which case no items are highlights
  // * an array containing item IDs which are highlights and others are
  //   lowlights
  // * an array containing "all" and item IDs each prepended by "-", where
  //   negated IDs are lowlights and others are highlights
  // * an object, in which case its keys are used as an array (as above)m
  //   regardless of their values
  // highlightsFirst is an optional boolean; if true, highlights are listed
  // first, then lowlights, though order is preserved within those groups. If
  // false or not specified, order is the same as the input.
  // Returns an array of objects, each of which has a one-to-one correspondence
  //   with an input item, using that object as its prototype and adding a
  //   boolean "highlight" property.
  function identifyHighlights(itemList, filter) {
    if (!Array.isArray(itemList)) {
      return itemList;
    }
    if (!Array.isArray(filter)) {
      if (filter === true || filter === "all") {
        filter = ["all"]
      } else if (typeof filter === "object") {
        filter = Object.keys(filter);
      } else {
        filter = [];
      }
    }
    return itemList.map(function(item) {
      if ((filter.includes("all")
              && !filter.includes("-" + item.id))
          || filter.includes(item.id)) {
        return inheritAndAdd(item, {highlight: true});
      } else {
        return inheritAndAdd(item, {highlight: false});
      }
    });
  }
  eleventyConfig.addFilter("identifyHighlights", identifyHighlights);

  // Identifies highlights in this and each of the child layers.
  //
  // itemList is an array of objects with
  //    "id" (string) and headAttribute (list of object) properties.
  // filter is a specification for how to filter this list and its children:
  // * true or "all", in which case all items on all layers are highlights
  // * some falsy value, in which case all items on all layers are lowlights
  // * an array containing item IDs, in which case all matching items on this
  //   layer are highlights, as well as all of their descendants, and all
  //   non-matching items on this layer and all of their descendants are
  //   lowlights
  // * an array containing "all" and item IDs preceded by "-", in which case all
  //   negated IDs and their descendants are lowlights, and all others and
  //   their descendants are highlights
  // * an object whose keys are used as an array (as above) to match this layer,
  //   but whose values are used as the value for filter when recursively
  //   calling on the value of headAttribute.
  //   If one of these keys exists, the child will be called with its value as
  //   the filter argument, in this order:
  //   * child.id
  //   * "-" + child.id
  //   * "all"
  //   * "-all"
  //   Otherwise, the child will be called with false.
  // headAttribute, nextAttribute, and tailAttributes are strings; nextAttribute
  //   and tailAttributes are optional.
  // Returns an array of objects, each of which has a one-to-one correspondence
  //   with an input item, using that object as its prototype and adding a
  //   boolean "highlight" property and a list of objects headAttribute property
  //   fulfilling the same type of contract as described here. Order is
  //   preserved within highlights and lowlights, but highlights are first in
  //   the list.
  function identifyHighlightsRecursive(itemList, filter, headAttribute, nextAttribute, ...tailAttributes) {
    if (Array.isArray(filter)) {
      const newFilter = {};
      filter.forEach(function(item) {
        if (item.startsWith("-")) {
          newFilter[item] = false;
        } else {
          newFilter[item] = true;
        }
      });
      filter = newFilter;
    } else if (typeof filter !== "object"){
      if (filter === true || filter === "all") {
        filter = { "all": true };
      } else {
        filter = {};
      }
    }
    const highlightList = identifyHighlights(itemList, filter);
    if (!headAttribute || !Array.isArray(highlightList)) {
      return highlightList;
    }
    highlightList.forEach(function(item) {
      if (!(headAttribute in item)) {
        // can't recurse into an item which doesn't have our recursive property
        return;
      }
      const children = item[headAttribute];
      const match = [item.id, "-" + item.id, "all", "-all"].find((key) => key in filter);
      const childFilter = match ? filter[match] : false;
      // safe to modify in-place because we got this result back from
      // identifyHighlights, which inherits from its input
      item[headAttribute] = identifyHighlightsRecursive(children, childFilter, nextAttribute, ...tailAttributes);
    });
    return highlightList;
  }
  eleventyConfig.addFilter("identifyHighlightsRecursive", identifyHighlightsRecursive);

  function sortHighlightsFirst(itemList) {
    return itemList.filter((it) => it.highlight).concat(itemList.filter((it) => !it.highlight));
  }
  eleventyConfig.addFilter("sortHighlightsFirst", sortHighlightsFirst);

  function identifyExperienceHighlights(roleList, filter) {
    const expandedRoleList = roleList.map(function(role) {
      const children = role.achievements
        ? role.achievements.slice()
        : [];
      const fullDescription = role.description || role.shortDescription;
      const shortDescription = role.description && role.shortDescription;
      const descriptionObject = {
        id: "description",
        full: fullDescription,
        short: shortDescription,
        highlight: false
      };
      children.push(descriptionObject);
      return inheritAndAdd(role, {
        description: descriptionObject,
        shortDescription: null,
        _children: children
      });
    });
    const highlightedRoleList = identifyHighlightsRecursive(expandedRoleList, filter, "_children");
    highlightedRoleList.forEach(function(role) {
      role.description = role._children[role._children.length - 1];
      role.achievements = role._children.slice(0, role._children.length - 1);
    });
    return highlightedRoleList;
  }
  eleventyConfig.addFilter("identifyExperienceHighlights", identifyExperienceHighlights);

  // Checks if there are any items with a truthy highlight property in itemList.
  function hasHighlights(itemList) {
    if (!Array.isArray(itemList)) {
      return false;
    }
    return itemList.some(function(item) {
      return item.highlight;
    });
  }
  eleventyConfig.addFilter("hasHighlights", hasHighlights);

  // Checks if there are any items with a falsy highlight property in itemList.
  function hasLowlights(itemList) {
    if (!Array.isArray(itemList)) {
      return false;
    }
    return itemList.some(function(item) {
      return !item.highlight;
    });
  }
  eleventyConfig.addFilter("hasLowlights", hasLowlights);

  // Checks if there are any items within this list or its children with a
  // truthy highlight property.
  function hasHighlightsRecursive(itemList, headAttribute, nextAttribute, ...tailAttributes) {
    if (!Array.isArray(itemList)) {
      return false;
    }
    return hasHighlights(itemList) || itemList.some(
      (child) => headAttribute in child && hasHighlightsRecursive(
        child[headAttribute], nextAttribute, ...tailAttributes));
  }
  eleventyConfig.addFilter("hasHighlightsRecursive", hasHighlightsRecursive);

  // Checks if there are any items within this list or its children with a
  // falsy highlight property.
  function hasLowlightsRecursive(itemList, headAttribute, nextAttribute, ...tailAttributes) {
    if (!Array.isArray(itemList)) {
      return false;
    }
    return hasLowlights(itemList) || itemList.some(
      (child) => headAttribute in child && hasLowlightsRecursive(
        child[headAttribute], nextAttribute, ...tailAttributes));
  }
  eleventyConfig.addFilter("hasLowlightsRecursive", hasLowlightsRecursive);

  eleventyConfig.addFilter("md", function(content) {
    return markdownIt.render(content);
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

  eleventyConfig.addNunjucksAsyncFilter("minifyCSS", function(code, callback) {
    return new CleanCSS({ level: 2, inline: ['all'] }).minify(code, (err, result) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, result.styles);
      }
    });
  });

  eleventyConfig.addFilter("minifyJS", function(code) {
    let minified = UglifyES.minify(code);
    if(minified.error) {
      console.log("UglifyES failed with an error: ", minified.error);
      throw new Error("Javascript minification failure");
    }
    return minified.code;
  });

  eleventyConfig.addDataExtension("yaml", contents => JSYaml.safeLoad(contents));

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
