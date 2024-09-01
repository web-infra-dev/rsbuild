import path from 'node:path';
import { promisify } from 'node:util';
import { lookup } from 'mrmime';
import {
  ensureAssetPrefix,
  fileExistsByCompilation,
  getPublicPathFromCompiler,
  isURL,
} from '../helpers';
import type { AppIconItem, HtmlBasicTag, RsbuildPlugin } from '../types';

type IconExtra = {
  sizes: string;
  isURL?: boolean;
  absolutePath: string;
  relativePath: string;
  requestPath: string;
  mimeType?: string;
};

export const pluginAppIcon = (): RsbuildPlugin => ({
  name: 'rsbuild:app-icon',

  setup(api) {
    const htmlTagsMap = new Map<string, HtmlBasicTag[]>();
    const iconFormatMap = new Map<string, IconExtra>();

    const formatIcon = (
      icon: AppIconItem,
      distDir: string,
      publicPath: string,
    ): AppIconItem & IconExtra => {
      const { src, size } = icon;
      const cached = iconFormatMap.get(src);

      if (cached) {
        return { ...cached, ...icon };
      }

      const sizes = `${size}x${size}`;

      if (isURL(src)) {
        const paths = {
          sizes,
          isURL: true,
          requestPath: src,
          absolutePath: src,
          relativePath: src,
          mimeType: lookup(src),
        };

        iconFormatMap.set(src, paths);

        return { ...paths, ...icon };
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
        sizes,
        requestPath,
        absolutePath,
        relativePath,
        mimeType: lookup(absolutePath),
      };

      iconFormatMap.set(src, paths);

      return { ...paths, ...icon };
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
          if (icon.target === 'web-app-manifest' && !appIcon.name) {
            throw new Error(
              "[rsbuild:app-icon] `appIcon.name` is required when `target` is 'web-app-manifest'.",
            );
          }

          if (!icon.isURL) {
            if (!compilation.inputFileSystem) {
              throw new Error(
                `[rsbuild:app-icon] 'compilation.inputFileSystem' is not available.`,
              );
            }

            if (
              !(await fileExistsByCompilation(compilation, icon.absolutePath))
            ) {
              throw new Error(
                `[rsbuild:app-icon] Can not find the app icon, please check if the '${icon.relativePath}' file exists'.`,
              );
            }

            const source = await promisify(
              compilation.inputFileSystem.readFile,
            )(icon.absolutePath);

            if (!source) {
              throw new Error(
                `[rsbuild:app-icon] Failed to read the app icon file, please check if the '${icon.relativePath}' file exists'.`,
              );
            }

            compilation.emitAsset(
              icon.relativePath,
              new sources.RawSource(source),
            );
          }

          if (
            icon.target === 'apple-touch-icon' ||
            (!icon.target && icon.size < 200)
          ) {
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
          const manifestIcons = icons
            .filter(
              (icon) => icon.target === 'web-app-manifest' || !icon.target,
            )
            .map((icon) => {
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
      iconFormatMap.clear();
    });
  },
});
