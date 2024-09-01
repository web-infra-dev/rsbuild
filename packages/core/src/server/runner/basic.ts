import path from 'node:path';

import type { CompilerOptions, Runner } from './type';

import type {
  BasicGlobalContext,
  BasicModuleScope,
  BasicRunnerFile,
  ModuleObject,
  RunnerRequirer,
} from './type';

const isRelativePath = (p: string) => /^\.\.?\//.test(p);
const getSubPath = (p: string) => {
  const lastSlash = p.lastIndexOf('/');
  let firstSlash = p.indexOf('/');

  if (lastSlash !== -1 && firstSlash !== lastSlash) {
    if (firstSlash !== -1) {
      let next = p.indexOf('/', firstSlash + 1);
      let dir = p.slice(firstSlash + 1, next);

      while (dir === '.') {
        firstSlash = next;
        next = p.indexOf('/', firstSlash + 1);
        dir = p.slice(firstSlash + 1, next);
      }
    }

    return p.slice(firstSlash + 1, lastSlash + 1);
  }
  return '';
};

export interface IBasicRunnerOptions {
  name: string;
  runInNewContext?: boolean;
  readFileSync: (path: string) => string;
  dist: string;
  compilerOptions: CompilerOptions;
}

export abstract class BasicRunner implements Runner {
  protected globalContext: BasicGlobalContext | null = null;
  protected baseModuleScope: BasicModuleScope | null = null;
  protected requirers: Map<string, RunnerRequirer> = new Map();
  constructor(protected _options: IBasicRunnerOptions) {}

  run(file: string): Promise<unknown> {
    if (!this.globalContext) {
      this.globalContext = this.createGlobalContext();
    }
    this.baseModuleScope = this.createBaseModuleScope();
    this.createRunner();
    const res = this.getRequire()(
      this._options.dist,
      file.startsWith('./') ? file : `./${file}`,
    );
    if (typeof res === 'object' && 'then' in res) {
      return res as Promise<unknown>;
    }
    return Promise.resolve(res);
  }

  getRequire(): RunnerRequirer {
    const entryRequire = this.requirers.get('entry')!;
    return (currentDirectory, modulePath, context = {}) => {
      const p = Array.isArray(modulePath)
        ? modulePath
        : modulePath.split('?')[0]!;
      return entryRequire(currentDirectory, p, context);
    };
  }

  protected abstract createGlobalContext(): BasicGlobalContext;
  protected abstract createBaseModuleScope(): BasicModuleScope;
  protected abstract createModuleScope(
    requireFn: RunnerRequirer,
    m: ModuleObject,
    file: BasicRunnerFile,
  ): BasicModuleScope;

  protected getFile(
    modulePath: string[] | string,
    currentDirectory: string,
  ): BasicRunnerFile | null {
    if (Array.isArray(modulePath)) {
      return {
        path: path.join(currentDirectory, '.array-require.js'),
        content: `module.exports = (${modulePath
          .map((arg) => {
            return `require(${JSON.stringify(`./${arg}`)})`;
          })
          .join(', ')});`,
        subPath: '',
      };
    }
    if (isRelativePath(modulePath)) {
      const p = path.join(currentDirectory, modulePath);
      return {
        path: p,
        content: this._options.readFileSync(p),
        subPath: getSubPath(modulePath),
      };
    }
    return null;
  }

  protected preExecute(_code: string, _file: BasicRunnerFile): void {}
  protected postExecute(
    _m: Record<string, any>,
    _file: BasicRunnerFile,
  ): void {}

  protected createRunner(): void {
    this.requirers.set(
      'entry',
      (_currentDirectory, _modulePath, _context = {}) => {
        throw new Error('Not implement');
      },
    );
  }
}
