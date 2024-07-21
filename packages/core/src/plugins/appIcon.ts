import fs from 'node:fs';
import path from 'node:path';
import { ensureAssetPrefix, isFileExists } from '../helpers';
import type { EnvironmentContext, RsbuildPlugin } from '../types';

export const pluginAppIcon = (): RsbuildPlugin => ({
  name: 'rsbuild:app-icon',

  setup(api) {
    const cache = new Map<
      string,
      { absolutePath: string; relativePath: string }
    >();

    const getIconPath = ({ config, name }: EnvironmentContext) => {
      const { appIcon } = config.html;
      if (!appIcon) {
        return;
      }

      const cached = cache.get(name);
      if (cached) {
        cached;
      }

      const distDir = config.output.distPath.image;
      const absolutePath = path.isAbsolute(appIcon)
        ? appIcon
        : path.join(api.context.rootPath, appIcon);
      const relativePath = path.posix.join(
        distDir,
        path.basename(absolutePath),
      );

      const paths = {
        absolutePath,
        relativePath,
      };

      cache.set(name, paths);

      return paths;
    };

    api.processAssets(
      { stage: 'additional' },
      async ({ compiler, compilation, environment }) => {
        const iconPath = getIconPath(environment);
        if (!iconPath) {
          return;
        }

        if (!(await isFileExists(iconPath.absolutePath))) {
          throw new Error(
            `[rsbuild:app-icon] Can not find the app icon, please check if the '${iconPath.relativePath}' file exists'.`,
          );
        }

        const source = await fs.promises.readFile(iconPath.absolutePath);

        compilation.emitAsset(
          iconPath.relativePath,
          new compiler.webpack.sources.RawSource(source, false),
        );
      },
    );

    api.modifyHTMLTags(
      ({ headTags, bodyTags }, { environment, compilation }) => {
        const iconPath = getIconPath(environment);
        if (!iconPath) {
          return { headTags, bodyTags };
        }

        headTags.unshift({
          tag: 'link',
          attrs: {
            rel: 'apple-touch-icon',
            sizes: '180*180',
            href: ensureAssetPrefix(
              iconPath.relativePath,
              compilation.outputOptions.publicPath,
            ),
          },
        });

        return { headTags, bodyTags };
      },
    );
  },
});
