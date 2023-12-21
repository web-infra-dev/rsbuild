import fs from 'fs';
import { posix, basename } from 'path';
import type { Compiler, Compilation } from '@rspack/core';
import WebpackSources from '@rsbuild/shared/webpack-sources';
import {
  withPublicPath,
  getPublicPathFromCompiler,
  COMPILATION_PROCESS_STAGE,
} from '@rsbuild/shared';
import { getHTMLPlugin } from '../provider/htmlPluginUtil';

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
        // @ts-expect-error compilation type mismatch
        .getHooks(compilation)
        .alterAssetTagGroups.tap(this.name, (data) => {
          const publicPath = getPublicPathFromCompiler(compiler);

          data.headTags.unshift({
            tagName: 'link',
            voidTag: true,
            attributes: {
              rel: 'apple-touch-icon',
              sizes: '180*180',
              href: withPublicPath(iconRelativePath, publicPath),
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
            stage: COMPILATION_PROCESS_STAGE.PROCESS_ASSETS_STAGE_PRE_PROCESS,
          },
          (assets) => {
            const source = fs.readFileSync(this.iconPath);
            assets[iconRelativePath] = new WebpackSources.RawSource(
              source,
              false,
            );
          },
        );
      },
    );
  }
}
