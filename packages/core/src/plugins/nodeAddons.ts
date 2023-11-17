import { dirname } from 'path';
import {
  color,
  findUpSync,
  getDistPath,
  getSharedPkgCompiledPath,
} from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';

export const pluginNodeAddons = (): RsbuildPlugin => ({
  name: 'plugin-node-addons',

  setup(api) {
    api.modifyBundlerChain(
      async (chain, { isServer, isServiceWorker, CHAIN_ID }) => {
        if (!isServer && !isServiceWorker) {
          return;
        }

        const getDistName = (resourcePath: string) => {
          const pkgJSON = findUpSync({
            filename: 'package.json',
            cwd: dirname(resourcePath),
          });

          if (!pkgJSON) {
            throw new Error(
              `Failed to compile Node.js addons, couldn't find the package.json of ${color.yellow(
                resourcePath,
              )}.`,
            );
          }

          const getFilename = (resource: string, pkgName: string) => {
            const reg = new RegExp(`node_modules/${pkgName}/(.+)`);
            const match = resource.match(reg);
            const filename = match?.[1];
            if (!filename) {
              return '[name].[ext]';
            }
            return `${filename}`;
          };

          const { name: pkgName } = require(pkgJSON);
          const config = api.getNormalizedConfig();
          const serverPath = getDistPath(config.output, 'server');
          return `${serverPath}/${getFilename(resourcePath, pkgName)}`;
        };

        chain.module
          .rule(CHAIN_ID.RULE.NODE)
          .test(/\.node$/)
          .use(CHAIN_ID.USE.NODE)
          .loader(getSharedPkgCompiledPath('node-loader'))
          .options({
            name: getDistName,
          });
      },
    );
  },
});
