import path from 'node:path';
import vm from 'node:vm';

import { BasicRunner } from './basic';
import type {
  BasicGlobalContext,
  BasicModuleScope,
  BasicRunnerFile,
  ModuleObject,
  RunnerRequirer,
} from './type';

const define = (...args: unknown[]) => {
  const factory = args.pop() as () => void;
  factory();
};

export class CommonJsRunner extends BasicRunner {
  protected createGlobalContext(): BasicGlobalContext {
    return {
      console: console,
      setTimeout: ((
        cb: (...args: any[]) => void,
        ms: number | undefined,
        ...args: any
      ) => {
        const timeout = setTimeout(cb, ms, ...args);
        timeout.unref();
        return timeout;
      }) as typeof setTimeout,
      clearTimeout: clearTimeout,
    };
  }

  protected createBaseModuleScope(): BasicModuleScope {
    const baseModuleScope: BasicModuleScope = {
      console: this.globalContext!.console,
      setTimeout: this.globalContext!.setTimeout,
      clearTimeout: this.globalContext!.clearTimeout,
      nsObj: (m: Record<string, any>) => {
        Object.defineProperty(m, Symbol.toStringTag, {
          value: 'Module',
        });
        return m;
      },
    };
    return baseModuleScope;
  }

  protected createModuleScope(
    requireFn: RunnerRequirer,
    m: ModuleObject,
    file: BasicRunnerFile,
  ): BasicModuleScope {
    return {
      ...this.baseModuleScope!,
      require: requireFn.bind(null, path.dirname(file.path)),
      module: m,
      exports: m.exports,
      __dirname: path.dirname(file.path),
      __filename: file.path,
      define,
    };
  }

  protected createRunner(): void {
    this.requirers.set('miss', this.createMissRequirer());
    this.requirers.set('entry', this.createCjsRequirer());
  }

  protected createMissRequirer(): RunnerRequirer {
    return (_currentDirectory, modulePath, _context = {}) => {
      const modulePathStr = modulePath as string;
      return require(
        modulePathStr.startsWith('node:')
          ? modulePathStr.slice(5)
          : modulePathStr,
      );
    };
  }

  protected createCjsRequirer(): RunnerRequirer {
    const requireCache = Object.create(null);

    return (currentDirectory, modulePath, context = {}) => {
      const file = context.file || this.getFile(modulePath, currentDirectory);
      if (!file) {
        return this.requirers.get('miss')!(currentDirectory, modulePath);
      }

      if (file.path in requireCache) {
        return requireCache[file.path].exports;
      }

      const m = {
        exports: {},
      };
      requireCache[file.path] = m;
      const currentModuleScope = this.createModuleScope(
        this.getRequire(),
        m,
        file,
      );

      const args = Object.keys(currentModuleScope);
      const argValues = args.map((arg) => currentModuleScope[arg]);
      const code = `(function(${args.join(', ')}) {
        ${file.content}
      })`;

      this.preExecute(code, file);
      const fn = this._options.runInNewContext
        ? vm.runInNewContext(code, this.globalContext!, file.path)
        : vm.runInThisContext(code, file.path);

      fn.call(m.exports, ...argValues);

      this.postExecute(m, file);
      return m.exports;
    };
  }
}
