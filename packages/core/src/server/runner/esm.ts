import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm, { type SourceTextModule } from 'node:vm';
import { asModule } from './asModule';

import { CommonJsRunner } from './cjs';
import { EsmMode, type RunnerRequirer } from './type';

export class EsmRunner extends CommonJsRunner {
  protected createRunner(): void {
    super.createRunner();
    this.requirers.set('cjs', this.getRequire());
    this.requirers.set('esm', this.createEsmRequirer());

    const outputModule =
      this._options.compilerOptions.experiments?.outputModule;

    this.requirers.set('entry', (currentDirectory, modulePath, context) => {
      const file = this.getFile(modulePath, currentDirectory);
      if (!file) {
        return this.requirers.get('miss')!(currentDirectory, modulePath);
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

  protected createEsmRequirer(): RunnerRequirer {
    const esmContext = vm.createContext(
      {
        ...this.baseModuleScope!,
        // support access globalThis in esm vm
        global: globalThis,
      },
      {
        name: 'context for esm',
      },
    );
    const esmCache = new Map<string, SourceTextModule>();
    const esmIdentifier = this._options.name;
    return (currentDirectory, modulePath, context = {}) => {
      if (!vm.SourceTextModule) {
        throw new Error(
          '[rsbuild:runner] Running ESM bundle needs add Node.js option "--experimental-vm-modules".',
        );
      }
      const _require = this.getRequire();
      const file = context.file || this.getFile(modulePath, currentDirectory);
      if (!file) {
        return this.requirers.get('miss')!(currentDirectory, modulePath);
      }

      let esm = esmCache.get(file.path);
      if (!esm) {
        esm = new vm.SourceTextModule(file.content, {
          identifier: `${esmIdentifier}-${file.path}`,
          // no attribute
          url: `${pathToFileURL(file.path).href}?${esmIdentifier}`,
          context: esmContext,
          initializeImportMeta: (meta: { url: string }, _: any) => {
            meta.url = pathToFileURL(file!.path).href;
          },
          importModuleDynamically: async (
            specifier: any,
            module: { context: any },
          ) => {
            const result = await _require(path.dirname(file!.path), specifier, {
              esmMode: EsmMode.Evaluated,
            });
            return await asModule(result, module.context);
          },
        } as any);
        esmCache.set(file.path, esm);
      }
      if (context.esmMode === EsmMode.Unlinked) return esm;
      return (async () => {
        await esm.link(async (specifier, referencingModule) => {
          return await asModule(
            await _require(
              path.dirname(
                referencingModule.identifier
                  ? referencingModule.identifier.slice(esmIdentifier.length + 1)
                  : fileURLToPath((referencingModule as any).url),
              ),
              specifier,
              {
                esmMode: EsmMode.Unlinked,
              },
            ),
            referencingModule.context,
            true,
          );
        });
        if ((esm as any).instantiate) (esm as any).instantiate();
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
