const path = require('node:path');
const { fse } = require('@rsbuild/shared');

class RsdoctorRspackPlugin {
  name = 'RsdoctorRspackPlugin';

  apply(compiler) {
    compiler.hooks.done.tap('rsdoctor:test', () => {
      fse.outputFileSync(path.join(__dirname, './test.txt'), 'test');
    });
  }
}

module.exports.RsdoctorRspackPlugin = RsdoctorRspackPlugin;
