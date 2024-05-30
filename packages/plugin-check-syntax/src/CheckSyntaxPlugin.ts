import { resolve } from 'node:path';
import type { Rspack } from '@rsbuild/core';
import { JS_REGEX, browserslistToESVersion, fse } from '@rsbuild/shared';
import { parse } from 'acorn';
import {
  checkIsExcludeSource,
  generateError,
  generateHtmlScripts,
  printErrors,
} from './helpers';
import type {
  AcornParseError,
  CheckSyntaxExclude,
  CheckSyntaxOptions,
  ECMASyntaxError,
  EcmaVersion,
} from './types';

type Compiler = Rspack.Compiler;
type Compilation = Rspack.Compilation;

const HTML_REGEX = /\.html$/;

export class CheckSyntaxPlugin {
  errors: ECMASyntaxError[] = [];

  ecmaVersion: EcmaVersion;

  targets: string[];

  rootPath: string;

  exclude: CheckSyntaxExclude | undefined;

  constructor(
    options: CheckSyntaxOptions &
      Required<Pick<CheckSyntaxOptions, 'targets'>> & {
        rootPath: string;
      },
  ) {
    this.targets = options.targets;
    this.exclude = options.exclude;
    this.rootPath = options.rootPath;
    this.ecmaVersion =
      options.ecmaVersion || browserslistToESVersion(this.targets);
  }

  apply(complier: Compiler) {
    complier.hooks.afterEmit.tapPromise(
      CheckSyntaxPlugin.name,
      async (compilation: Compilation) => {
        const outputPath = compilation.outputOptions.path || 'dist';

        // not support compilation.emittedAssets in Rspack
        const emittedAssets = compilation
          .getAssets()
          .filter((a) => a.source)
          .map((a) => {
            // remove query from name
            const resourcePath = a.name.split('?')[0];
            return resolve(outputPath, resourcePath);
          });

        const files = emittedAssets.filter(
          (assets) => HTML_REGEX.test(assets) || JS_REGEX.test(assets),
        );
        await Promise.all(
          files.map(async (file) => {
            await this.check(file);
          }),
        );

        printErrors(this.errors);
      },
    );
  }

  private async check(filepath: string) {
    if (HTML_REGEX.test(filepath)) {
      const htmlScripts = await generateHtmlScripts(filepath);
      await Promise.all(
        htmlScripts.map(async (script) => {
          if (!checkIsExcludeSource(filepath, this.exclude)) {
            await this.tryParse(filepath, script);
          }
        }),
      );
    }

    if (JS_REGEX.test(filepath)) {
      const jsScript = await fse.readFile(filepath, 'utf-8');
      await this.tryParse(filepath, jsScript);
    }
  }

  private async tryParse(filepath: string, code: string) {
    try {
      parse(code, { ecmaVersion: this.ecmaVersion });
    } catch (_: unknown) {
      const err = _ as AcornParseError;

      const error = await generateError({
        err,
        code,
        filepath,
        exclude: this.exclude,
        rootPath: this.rootPath,
      });

      if (error) {
        this.errors.push(error);
      }
    }
  }
}
