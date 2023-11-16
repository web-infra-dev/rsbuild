const { getOptions } = require('loader-utils');

/**
 * @template {{
 *   mode: 'async' | 'callback' | 'sync';
 *   pitchResult?: string;
 * }} Options
 */

/**
 * @type {import("webpack").LoaderDefinitionFunction<Options, {}>}
 */
module.exports = function (input) {
  /**
   * @type Options
   */
  const options =
    typeof this.getOptions === 'function'
      ? this.getOptions()
      : getOptions(this);
  const res = [input, '// hello world'].join('\n');

  if (options.mode === 'async') {
    const cb = this.async();
    setTimeout(() => {
      cb(null, res);
    }, 3000);
  } else if (options.mode === 'callback') {
    this.callback(null, res);
  } else {
    return res;
  }
};

module.exports.pitch = function () {
  /**
   * @type Options
   */
  const options =
    typeof this.getOptions === 'function'
      ? this.getOptions()
      : getOptions(this);

  if (options.pitchResult) {
    return options.pitchResult;
  }
};
