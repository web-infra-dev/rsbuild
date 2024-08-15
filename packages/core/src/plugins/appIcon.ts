import fs from 'node:fs';
import path from 'node:path';
import { ensureAssetPrefix, isFileExists } from '../helpers';
import type { AppIconItem, HtmlBasicTag, RsbuildPlugin } from '../types';

export const pluginAppIcon = (): RsbuildPlugin => ({
  name: 'rsbuild:app-icon',

  setup(api) {
    const htmlTagsMap = new Map<string, HtmlBasicTag[]>();
    const iconPathMap = new Map<
      string,
      { absolutePath: string; relativePath: string }
    >();

    const formatIcon = (icon: AppIconItem, distDir: string) => {
      const { src, size } = icon;
      const cached = iconPathMap.get(src);
      const sizes = `${size}x${size}`;

      if (cached) {
        return {
          sizes,
          ...cached,
          ...icon,
        };
      }

      const absolutePath = path.isAbsolute(src)
        ? src
        : path.join(api.context.rootPath, src);
      const relativePath = path.posix.join(
        distDir,
        path.basename(absolutePath),
      );

      const paths = {
        absolutePath,
        relativePath,
      };

      iconPathMap.set(src, paths);

      return {
        sizes,
        ...paths,
        ...icon,
      };
    };

    api.processAssets(
      { stage: 'additional' },
      async ({ compilation, environment, sources }) => {
        const { config } = environment;
        const { appIcon } = config.html;

        if (!appIcon) {
          return;
        }

        const distDir = config.output.distPath.image;
        const { publicPath } = compilation.outputOptions;
        const icons = appIcon.icons.map((icon) => formatIcon(icon, distDir));
        const tags: HtmlBasicTag[] = [];

        for (const icon of icons) {
          if (!(await isFileExists(icon.absolutePath))) {
            throw new Error(
              `[rsbuild:app-icon] Can not find the app icon, please check if the '${icon.relativePath}' file exists'.`,
            );
          }

          const source = await fs.promises.readFile(icon.absolutePath);

          compilation.emitAsset(
            icon.relativePath,
            new sources.RawSource(source),
          );

          if (icon.size < 200) {
            tags.push({
              tag: 'link',
              attrs: {
                rel: 'apple-touch-icon',
                sizes: icon.sizes,
                href: ensureAssetPrefix(icon.relativePath, publicPath),
              },
            });
          }
        }

        if (appIcon.name) {
          const manifestIcons = icons.map((icon) => ({
            src: icon.relativePath,
            sizes: icon.sizes,
          }));

          const manifest = {
            name: appIcon.name,
            icons: manifestIcons,
          };

          const manifestFile = 'manifest.webmanifest';

          compilation.emitAsset(
            manifestFile,
            new sources.RawSource(JSON.stringify(manifest)),
          );

          tags.push({
            tag: 'link',
            attrs: {
              rel: 'manifest',
              href: ensureAssetPrefix(manifestFile, publicPath),
            },
          });
        }

        if (tags.length) {
          htmlTagsMap.set(environment.name, tags);
        }
      },
    );

    api.modifyHTMLTags(({ headTags, bodyTags }, { environment }) => {
      const tags = htmlTagsMap.get(environment.name);
      if (tags) {
        headTags.unshift(...tags);
      }
      return { headTags, bodyTags };
    });

    api.onCloseDevServer(() => {
      htmlTagsMap.clear();
      iconPathMap.clear();
    });
  },
});
