import fs from 'node:fs';
import { basename, posix } from 'node:path';
import type { Compilation, Compiler } from '@rspack/core';
import { ensureAssetPrefix } from '../helpers';
import { getHTMLPlugin } from '../pluginHelper';

type AppIconOptions = {
  distDir: string;
  iconPath: string;
};

export class HtmlAppIconPlugin {
  readonly name: string;

  readonly distDir: string;

  readonly iconPath: string;

  constructor(options: AppIconOptions) {
    this.name = 'HtmlAppIconPlugin';
    this.distDir = options.distDir;
    this.iconPath = options.iconPath;
  }

  apply(compiler: Compiler) {
    if (!fs.existsSync(this.iconPath)) {
      throw new Error(
        `[${this.name}] Can not find the app icon, please check if the '${this.iconPath}' file exists'.`,
      );
    }

    const iconRelativePath = posix.join(this.distDir, basename(this.iconPath));

    // add html asset tags
    compiler.hooks.compilation.tap(this.name, (compilation: Compilation) => {
      getHTMLPlugin()
        .getHooks(compilation)
        .alterAssetTagGroups.tap(this.name, (data) => {
          data.headTags.unshift({
            tagName: 'link',
            voidTag: true,
            attributes: {
              rel: 'apple-touch-icon',
              sizes: '180*180',
              href: ensureAssetPrefix(
                iconRelativePath,
                compilation.outputOptions.publicPath,
              ),
            },
            meta: {},
          });

          return data;
        });
    });

    // copy icon to dist
    compiler.hooks.thisCompilation.tap(
      this.name,
      (compilation: Compilation) => {
        compilation.hooks.processAssets.tap(
          {
            name: this.name,
            stage:
              compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_PRE_PROCESS,
          },
          () => {
            const source = fs.readFileSync(this.iconPath);
            compilation.emitAsset(
              iconRelativePath,
              new compiler.webpack.sources.RawSource(source, false),
            );
          },
        );
      },
    );
  }
}
