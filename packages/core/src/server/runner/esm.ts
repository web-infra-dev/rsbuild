import { isBuiltin } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { SourceTextModule } from 'node:vm';
import { color, require } from '../../helpers';
import { asModule } from './asModule';
import { CommonJsRunner } from './cjs';
import { EsmMode, type RunnerRequirer } from './type';

export class EsmRunner extends CommonJsRunner {
  protected createRunner(): void {
    super.createRunner();
    this.requirers.set('cjs', this.getRequire());
    this.requirers.set('esm', this.createEsmRequirer());

    const outputModule = this._options.compilerOptions.output.module;

    this.requirers.set('entry', (currentDirectory, modulePath, context) => {
      const file = this.getFile(modulePath, currentDirectory);
      if (!file) {
        return this.requirers.get('miss')!(
          currentDirectory,
          modulePath,
          context,
        );
      }

      if (outputModule && !file.path.endsWith('.cjs')) {
        return this.requirers.get('esm')!(currentDirectory, modulePath, {
          ...context,
          file,
        });
      }
      return this.requirers.get('cjs')!(currentDirectory, modulePath, {
        ...context,
        file,
      });
    });
  }

  protected createMissRequirer(): RunnerRequirer {
    const cjsRequirer = super.createMissRequirer();
    const esmRequirer: RunnerRequirer = async (
      currentDirectory,
      modulePath,
    ) => {
      if (Array.isArray(modulePath)) {
        throw new Error(
          `${color.dim('[rsbuild:runner]')} Array module paths cannot be loaded as ESM externals.`,
        );
      }

      try {
        const specifier =
          isBuiltin(modulePath) ||
          modulePath.startsWith('node:') ||
          modulePath.startsWith('file:') ||
          modulePath.startsWith('data:')
            ? modulePath
            : pathToFileURL(
                await this._options.resolveModule(currentDirectory, modulePath),
              ).href;

        return await import(/* webpackIgnore: true */ specifier);
      } catch (error) {
        if (error instanceof Error) {
          error.message += `\n${color.dim('[rsbuild:runner]')} Failed to import external module ${color.yellow(modulePath)} from ${color.yellow(currentDirectory)}.`;
          throw error;
        }
        throw new Error(
          `${color.dim('[rsbuild:runner]')} Failed to import external module ${color.yellow(modulePath)} from ${color.yellow(currentDirectory)}.`,
          { cause: error },
        );
      }
    };

    return (currentDirectory, modulePath, context = {}) =>
      context.esmMode === undefined
        ? cjsRequirer(currentDirectory, modulePath, context)
        : esmRequirer(currentDirectory, modulePath, context);
  }

  protected createEsmRequirer(): RunnerRequirer {
    const esmCache = new Map<string, SourceTextModule>();
    const esmIdentifier = this._options.name;
    // rslint-disable-next-line @typescript-eslint/no-require-imports
    const vm = require('node:vm') as typeof import('node:vm');
    type SourceTextModuleOptionsWithUrl = NonNullable<
      ConstructorParameters<typeof vm.SourceTextModule>[1]
    > & {
      url?: string;
    };

    return (currentDirectory, modulePath, context = {}) => {
      if (!vm.SourceTextModule) {
        throw new Error(
          `${color.dim('[rsbuild:runner]')} Running ESM bundle needs add Node.js option ${color.yellow('--experimental-vm-modules')}.`,
        );
      }
      const _require = this.getRequire();
      const file = context.file || this.getFile(modulePath, currentDirectory);
      if (!file) {
        return this.requirers.get('miss')!(
          currentDirectory,
          modulePath,
          context,
        );
      }

      let esm = esmCache.get(file.path);
      if (!esm) {
        const sourceTextModuleOptions: SourceTextModuleOptionsWithUrl = {
          identifier: file.path,
          // no attribute
          url: `${pathToFileURL(file.path).href}?${esmIdentifier}`,
          // run in current execution context
          initializeImportMeta: (meta) => {
            meta.url = pathToFileURL(file.path).href;
          },
          importModuleDynamically: async (specifier, module) => {
            const result = await _require(path.dirname(file.path), specifier, {
              esmMode: EsmMode.Evaluated,
            });
            return asModule(result, module.context);
          },
        };
        esm = new vm.SourceTextModule(file.content, sourceTextModuleOptions);
        esmCache.set(file.path, esm);
      }
      if (context.esmMode === EsmMode.Unlinked) return esm;
      return (async () => {
        await esm.link(async (specifier, referencingModule) => {
          return asModule(
            await _require(path.dirname(referencingModule.identifier), specifier, {
              esmMode: EsmMode.Unlinked,
            }),
            referencingModule.context,
            true,
          );
        });

        await esm.evaluate();
        if (context.esmMode === EsmMode.Evaluated) {
          return esm;
        }
        const ns = esm.namespace as {
          default: unknown;
        };
        return ns.default && ns.default instanceof Promise ? ns.default : ns;
      })();
    };
  }
}
