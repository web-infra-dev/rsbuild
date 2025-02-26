const path = require('node:path');
const fse = require('fs-extra');

class RsdoctorRspackPlugin {
  name = 'RsdoctorRspackPlugin';

  apply(compiler) {
    compiler.hooks.done.tap('rsdoctor:test', () => {
      fse.outputFileSync(path.join(__dirname, './test-temp.txt'), 'test');
    });
  }
}

module.exports.RsdoctorRspackPlugin = RsdoctorRspackPlugin;
