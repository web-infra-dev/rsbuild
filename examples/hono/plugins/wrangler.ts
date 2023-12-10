import { ChildProcess, spawn } from 'child_process';
import { RsbuildPlugin } from '@rsbuild/core';

export const pluginWrangler = (): RsbuildPlugin => ({
  name: 'plugin-wrangler',
  setup(api) {
    let wranglerProcess: ChildProcess | undefined = undefined;

    const shutdownWrangler = () =>
      new Promise<void>((resolve) => {
        if (wranglerProcess && !wranglerProcess.killed) {
          const onResolve = () => {
            wranglerProcess?.removeAllListeners();
            wranglerProcess = undefined;
            resolve();
          };
          wranglerProcess.on('exit', onResolve);
          wranglerProcess.on('close', onResolve);
          wranglerProcess.on('error', onResolve);
          wranglerProcess.kill();
        }
      });

    api.modifyBundlerChain((chain, { CHAIN_ID, target }) => {
      chain.plugin(CHAIN_ID.PLUGIN.DEFINE).tap(([vars]) => {
        vars['process.env.TARGET'] = JSON.stringify(target);
        return [vars];
      });
      if (target === 'service-worker') {
        chain.output.libraryTarget('commonjs2');
      }
    });

    api.onDevCompileDone(async ({ isFirstCompile }) => {
      if (!isFirstCompile) return;
      const entry = require.resolve('wrangler');
      const { port } = api.context.devServer!;
      const args = [
        entry,
        'dev',
        '--var',
        `CDN_BASEURL:http://localhost:${port}`,
      ];
      wranglerProcess = spawn(process.execPath, args, { stdio: 'inherit' });
      wranglerProcess.on('error', process.exit);
    });

    api.onRestartDevServer(shutdownWrangler);
    api.onExit(shutdownWrangler);
  },
});
