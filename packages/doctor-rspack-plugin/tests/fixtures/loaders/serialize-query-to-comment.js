const { parseQuery } = require('loader-utils');

/**
 * @type {import("webpack").LoaderDefinitionFunction<{}, {}>}
 */
module.exports = function (input) {
  const res = [input, `// ${JSON.stringify(this.query)}`];

  // Based on https://github.com/windicss/windicss-webpack-plugin/blob/main/src/loaders/windicss-template.ts#L42
  // test the loader query
  if (this.query !== '') {
    res.push(`// ${JSON.stringify(parseQuery(this.query))}`);
  }

  return res.join('\n');
};
