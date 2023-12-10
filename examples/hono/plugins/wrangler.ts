import { ChildProcess, spawn } from 'child_process';
import { RsbuildPlugin, Rspack } from '@rsbuild/core';

export const pluginWrangler = (): RsbuildPlugin => ({
  name: 'plugin-wrangler',
  setup(api) {
    let wranglerProcess: ChildProcess;
    api.modifyBundlerChain((chain, { CHAIN_ID, target }) => {
      chain.plugin(CHAIN_ID.PLUGIN.DEFINE).tap(([vars]) => {
        vars['process.env.TARGET'] = JSON.stringify(target);
        return [vars];
      });
    });
    api.onDevCompileDone(({ isFirstCompile }) => {
      if (isFirstCompile) {
        const entry = require.resolve('wrangler');
        const args = [entry, 'dev'];
        wranglerProcess = spawn(process.execPath, args, { stdio: 'inherit' });
        wranglerProcess.on('exit', process.exit);
        wranglerProcess.on('error', process.exit);
      }
    });
  },
});
