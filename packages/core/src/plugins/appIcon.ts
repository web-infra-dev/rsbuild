import path from 'node:path';
import { promisify } from 'node:util';
import { lookup } from 'mrmime';
import {
  ensureAssetPrefix,
  fileExistsByCompilation,
  getPublicPathFromCompiler,
} from '../helpers';
import type { AppIconItem, HtmlBasicTag, RsbuildPlugin } from '../types';

export const pluginAppIcon = (): RsbuildPlugin => ({
  name: 'rsbuild:app-icon',

  setup(api) {
    const htmlTagsMap = new Map<string, HtmlBasicTag[]>();
    const iconPathMap = new Map<
      string,
      {
        absolutePath: string;
        relativePath: string;
        requestPath: string;
        mimeType?: string;
      }
    >();

    const formatIcon = (
      icon: AppIconItem,
      distDir: string,
      publicPath: string,
    ) => {
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
      const requestPath = ensureAssetPrefix(relativePath, publicPath);

      const paths = {
        requestPath,
        absolutePath,
        relativePath,
        mimeType: lookup(absolutePath),
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
        const manifestFile = appIcon.filename ?? 'manifest.webmanifest';
        const publicPath = getPublicPathFromCompiler(compilation);
        const icons = appIcon.icons.map((icon) =>
          formatIcon(icon, distDir, publicPath),
        );
        const tags: HtmlBasicTag[] = [];

        for (const icon of icons) {
          if (
            !(await fileExistsByCompilation(compilation, icon.absolutePath))
          ) {
            throw new Error(
              `[rsbuild:app-icon] Can not find the app icon, please check if the '${icon.relativePath}' file exists'.`,
            );
          }

          const source = await promisify(compilation.inputFileSystem.readFile)(
            icon.absolutePath,
          );

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
                href: icon.requestPath,
              },
            });
          }
        }

        if (appIcon.name) {
          const manifestIcons = icons.map((icon) => {
            const result = {
              src: icon.requestPath,
              sizes: icon.sizes,
            };
            if (icon.mimeType) {
              return { ...result, type: icon.mimeType };
            }
            return result;
          });

          const manifest = {
            name: appIcon.name,
            icons: manifestIcons,
          };

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
