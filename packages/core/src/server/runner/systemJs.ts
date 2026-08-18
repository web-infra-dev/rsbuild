import path from 'node:path';
import { isBuiltin, SourceMap, type SourceMapPayload } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { experiments } from '@rspack/core';
import type { IBasicRunnerOptions } from './basic';
import { color } from '../../helpers';
import { transformToSystemJs, type SwcTransform } from './systemJsTransform';
import type { Runner, RunnerRequirer } from './type';

type Namespace = Record<PropertyKey, unknown>;

interface SystemJsExport {
  (name: string, value: unknown): unknown;
  (exports: Record<string, unknown>): Record<string, unknown>;
}

type SystemJsContext = {
  import: (specifier: string) => Promise<unknown>;
  meta: SystemJsImportMeta;
};

type SystemJsImportMeta = {
  dirname: string;
  filename: string;
  glob: () => never;
  resolve: (specifier: string, parent?: string) => never;
  url: string;
};

type SystemJsDeclaration = {
  execute: () => void | Promise<void>;
  setters: Array<(namespace: Namespace) => void>;
};

type SystemJsImportMetadata = {
  importedNames?: string[];
};

type SystemJsRegistrationSource = {
  declare: (
    exportValue: SystemJsExport,
    context: SystemJsContext,
  ) => SystemJsDeclaration;
  dependencies: string[];
};

type SystemJsRegistration = SystemJsRegistrationSource & {
  importMetadata: SystemJsImportMetadata[];
  mapErrorStack: (error: unknown) => void;
};

class SystemJsMissingExportError extends SyntaxError {}

const INLINE_SOURCE_MAP =
  /\/\/[#@]\s*sourceMappingURL=data:application\/json;base64,([^\s]+)/;

const SOURCE_MAP_COMMENT =
  /(?:\/\/[#@]\s*sourceMappingURL=([^\s]+)|\/\*[#@]\s*sourceMappingURL=([^*]+?)\s*\*\/)/gm;

const SOURCE_MAP_DATA_URL =
  /^data:application\/json(?:;charset=[^;,]+)?(?:(;base64))?,(.*)$/i;

const throwUnsupportedImportMetaMethod = (method: string): never => {
  throw new Error(
    `${color.dim('[rsbuild:runner]')} import.meta.${method}() is not supported.`,
  );
};

const createImportMeta = (moduleId: string): SystemJsImportMeta => ({
  dirname: path.dirname(moduleId),
  filename: moduleId,
  glob: () => throwUnsupportedImportMetaMethod('glob'),
  resolve: () => throwUnsupportedImportMetaMethod('resolve'),
  url: pathToFileURL(moduleId).href,
});

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createStackTraceMapper = (code: string, moduleId: string) => {
  const encodedSourceMap = INLINE_SOURCE_MAP.exec(code)?.[1];
  if (!encodedSourceMap) {
    return (_error: unknown): void => {};
  }

  let sourceMap: SourceMap;
  try {
    const payload = JSON.parse(
      Buffer.from(encodedSourceMap, 'base64').toString(),
    ) as SourceMapPayload;
    sourceMap = new SourceMap(payload);
  } catch {
    return (_error: unknown): void => {};
  }

  const moduleFrame = new RegExp(
    `${escapeRegExp(moduleId)}:(\\d+):(\\d+)`,
    'g',
  );
  return (error: unknown): void => {
    // Node handles Function source maps natively. Only fall back to rewriting
    // the stack when another tool has installed its own stack formatter.
    if (
      Error.prepareStackTrace === undefined ||
      !(error instanceof Error) ||
      !error.stack
    ) {
      return;
    }
    error.stack = error.stack.replace(moduleFrame, (frame, line, column) => {
      const origin = sourceMap.findOrigin(Number(line), Number(column));
      if (!('fileName' in origin)) {
        return frame;
      }
      return `${origin.fileName}:${origin.lineNumber}:${origin.columnNumber}`;
    });
  };
};

type SystemJsModuleState =
  | 'registering'
  | 'registered'
  | 'instantiating'
  | 'instantiated'
  | 'evaluating'
  | 'evaluated'
  | 'failed';

type SystemJsEvaluationDependency =
  | {
      kind: 'bundle';
      module: SystemJsModuleNode;
    }
  | {
      kind: 'external';
      metadata?: SystemJsImportMetadata;
      setter: (namespace: Namespace) => void;
      specifier: string;
    };

type SystemJsModuleNode = {
  dependencies: SystemJsEvaluationDependency[];
  error?: unknown;
  evaluationPromise?: Promise<void>;
  execute?: SystemJsDeclaration['execute'];
  exportSlots: Map<string, unknown>;
  id: string;
  importers: Array<{
    setter: (namespace: Namespace) => void;
  }>;
  instantiatePromise?: Promise<void>;
  namespace: Namespace;
  registration?: SystemJsRegistration;
  registrationPromise?: Promise<void>;
  state: SystemJsModuleState;
};

const createNamespace = (): Namespace => {
  const namespace = Object.create(null) as Namespace;
  Object.defineProperty(namespace, Symbol.toStringTag, {
    configurable: false,
    enumerable: false,
    value: 'Module',
  });
  return namespace;
};

const createSystemJsDeclaration = (
  registration: SystemJsRegistrationSource,
  exportValue: SystemJsExport,
  context: SystemJsContext,
  moduleId: string,
): SystemJsDeclaration => {
  const declaration = registration.declare(exportValue, context);
  if (
    !declaration ||
    !Array.isArray(declaration.setters) ||
    typeof declaration.execute !== 'function' ||
    declaration.setters.length !== registration.dependencies.length
  ) {
    throw new Error(
      `${color.dim('[rsbuild:runner]')} Invalid SystemJS declaration for ${moduleId}`,
    );
  }
  return declaration;
};

const analysisExport = ((
  nameOrExports: string | Record<string, unknown>,
  value?: unknown,
) =>
  typeof nameOrExports === 'object' ? nameOrExports : value) as SystemJsExport;

const collectImportMetadata = (
  registration: SystemJsRegistrationSource,
  moduleId: string,
): SystemJsImportMetadata[] => {
  const declaration = createSystemJsDeclaration(
    registration,
    analysisExport,
    {
      import: (specifier) => {
        throw new Error(
          `${color.dim('[rsbuild:runner]')} Unexpected dynamic import ${specifier} while analyzing SystemJS module ${moduleId}`,
        );
      },
      meta: createImportMeta(moduleId),
    },
    moduleId,
  );

  return declaration.setters.map((setter) => {
    const importedNames = new Set<string>();
    const trackingNamespace = new Proxy(Object.create(null) as Namespace, {
      get: (_target, property) => {
        if (typeof property === 'string') {
          importedNames.add(property);
        }
        return undefined;
      },
      has: (_target, property) => {
        if (typeof property === 'string') {
          importedNames.add(property);
        }
        return false;
      },
      ownKeys: () => [],
    });
    setter(trackingNamespace);
    return importedNames.size > 0 ? { importedNames: [...importedNames] } : {};
  });
};

const analyzeImportedModDifference = (
  mod: Namespace,
  rawId: string,
  metadata?: SystemJsImportMetadata,
): void => {
  if (!metadata?.importedNames?.length) {
    return;
  }
  const missingBindings = metadata.importedNames.filter(
    (name) => !(name in mod),
  );
  if (missingBindings.length > 0) {
    const lastBinding = missingBindings[missingBindings.length - 1];
    throw new SystemJsMissingExportError(
      `${color.dim('[rsbuild:runner]')} The requested module '${rawId}' does not provide an export named '${lastBinding}'`,
    );
  }
};

const captureRegistration = (
  code: string,
  moduleId: string,
): SystemJsRegistration => {
  const registrations: unknown[][] = [];
  // rslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function('System', code)({
    register: (...args: unknown[]) => {
      registrations.push(args);
    },
  });

  if (registrations.length !== 1) {
    throw new Error(
      `${color.dim('[rsbuild:runner]')} Expected exactly one System.register while registering ${moduleId}`,
    );
  }
  const [dependencies, declare, ...extra] = registrations[0];
  if (
    extra.length > 0 ||
    !Array.isArray(dependencies) ||
    dependencies.some((dependency) => typeof dependency !== 'string') ||
    typeof declare !== 'function'
  ) {
    throw new Error(
      `${color.dim('[rsbuild:runner]')} Malformed anonymous System.register in ${moduleId}`,
    );
  }
  const registration: SystemJsRegistrationSource = {
    declare: declare as SystemJsRegistration['declare'],
    dependencies: dependencies as string[],
  };
  return {
    ...registration,
    importMetadata: collectImportMetadata(registration, moduleId),
    mapErrorStack: createStackTraceMapper(code, moduleId),
  };
};

class SystemJsEvaluator {
  readonly #bundleOutputRoot: string;
  readonly #isBundleOutput: IBasicRunnerOptions['isBundleOutput'];
  readonly #readFileSync: IBasicRunnerOptions['readFileSync'];
  readonly #modules = new Map<string, SystemJsModuleNode>();

  constructor(options: IBasicRunnerOptions) {
    this.#bundleOutputRoot = options.dist;
    this.#isBundleOutput = options.isBundleOutput;
    this.#readFileSync = options.readFileSync;
  }

  async evaluate(moduleId: string): Promise<Namespace> {
    const normalizedId = this.#normalizeBundleModuleId(moduleId);
    if (!this.#isBundleOutput(normalizedId)) {
      throw new Error(
        `${color.dim('[rsbuild:runner]')} Unknown bundle module ${normalizedId}`,
      );
    }
    const moduleNode = await this.#getModule(normalizedId);
    await this.#instantiate(moduleNode);
    await this.#evaluateModule(moduleNode, new Set());
    return moduleNode.namespace;
  }

  async #getModule(moduleId: string): Promise<SystemJsModuleNode> {
    const existingModule = this.#modules.get(moduleId);
    if (existingModule) {
      await existingModule.registrationPromise;
      if (existingModule.state === 'failed') {
        throw existingModule.error;
      }
      return existingModule;
    }

    const moduleNode: SystemJsModuleNode = {
      dependencies: [],
      exportSlots: new Map(),
      id: moduleId,
      importers: [],
      namespace: createNamespace(),
      state: 'registering',
    };
    this.#modules.set(moduleId, moduleNode);
    moduleNode.registrationPromise = Promise.resolve()
      .then(() => this.#transformBundleModule(moduleId))
      .then((code) => {
        moduleNode.registration = captureRegistration(code, moduleId);
        moduleNode.state = 'registered';
      })
      .catch((error) => {
        moduleNode.error = error;
        moduleNode.state = 'failed';
        throw error;
      });

    await moduleNode.registrationPromise;
    return moduleNode;
  }

  #createExport(moduleNode: SystemJsModuleNode): SystemJsExport {
    return ((
      nameOrExports: string | Record<string, unknown>,
      value?: unknown,
    ) => {
      if (typeof nameOrExports === 'object') {
        for (const [name, exportValue] of Object.entries(nameOrExports)) {
          this.#setExport(moduleNode, name, exportValue);
        }
        return nameOrExports;
      }
      this.#setExport(moduleNode, nameOrExports, value);
      return value;
    }) as SystemJsExport;
  }

  #setExport(moduleNode: SystemJsModuleNode, name: string, value: unknown) {
    const isNew = !moduleNode.exportSlots.has(name);
    const previous = moduleNode.exportSlots.get(name);
    moduleNode.exportSlots.set(name, value);
    if (isNew) {
      Object.defineProperty(moduleNode.namespace, name, {
        configurable: false,
        enumerable: true,
        get: () => moduleNode.exportSlots.get(name),
      });
    }
    if (isNew || !Object.is(previous, value)) {
      for (const importer of moduleNode.importers) {
        importer.setter(moduleNode.namespace);
      }
    }
  }

  async #instantiate(moduleNode: SystemJsModuleNode): Promise<void> {
    if (moduleNode.state === 'failed') {
      throw moduleNode.error;
    }
    if (moduleNode.instantiatePromise) {
      return moduleNode.instantiatePromise;
    }
    if (
      moduleNode.state === 'instantiated' ||
      moduleNode.state === 'evaluating' ||
      moduleNode.state === 'evaluated'
    ) {
      return;
    }
    const registration = moduleNode.registration;
    if (!registration) {
      throw new Error(
        `${color.dim('[rsbuild:runner]')} SystemJS module ${moduleNode.id} is not registered`,
      );
    }

    moduleNode.state = 'instantiating';
    const promise = (async () => {
      const declaration = createSystemJsDeclaration(
        registration,
        this.#createExport(moduleNode),
        {
          import: (specifier) => this.#import(specifier, moduleNode.id),
          meta: createImportMeta(moduleNode.id),
        },
        moduleNode.id,
      );
      moduleNode.execute = declaration.execute;

      for (let index = 0; index < registration.dependencies.length; index++) {
        const specifier = registration.dependencies[index];
        const setter = declaration.setters[index];
        const bundleModuleId = this.#resolveBundleModuleId(
          specifier,
          moduleNode.id,
        );
        if (bundleModuleId) {
          const dependency = await this.#getModule(bundleModuleId);
          if (dependency.state !== 'instantiating') {
            await this.#instantiate(dependency);
          }
          dependency.importers.push({ setter });
          moduleNode.dependencies.push({ kind: 'bundle', module: dependency });
          setter(dependency.namespace);
          continue;
        }

        moduleNode.dependencies.push({
          kind: 'external',
          metadata: registration.importMetadata[index],
          setter,
          specifier,
        });
      }
      moduleNode.state = 'instantiated';
    })().catch((error) => {
      registration.mapErrorStack(error);
      moduleNode.error = error;
      moduleNode.state = 'failed';
      throw error;
    });
    moduleNode.instantiatePromise = promise;
    return promise;
  }

  #resolveBundleModuleId(
    specifier: string,
    importer: string,
  ): string | undefined {
    const request = specifier.split(/[?#]/, 1)[0].replaceAll('\\', '/');
    if (request.startsWith('.')) {
      const resolved = path.resolve(path.dirname(importer), request);
      if (!this.#isBundleOutput(resolved)) {
        return;
      }
      return resolved;
    }
    const candidate = path.isAbsolute(request)
      ? path.normalize(request)
      : path.resolve(this.#bundleOutputRoot, request);
    return this.#isBundleOutput(candidate) ? candidate : undefined;
  }

  #normalizeBundleModuleId(moduleId: string): string {
    if (!path.isAbsolute(moduleId)) {
      throw new Error(
        `${color.dim('[rsbuild:runner]')} Bundle module ID must be absolute: ${moduleId}`,
      );
    }
    const normalized = path.normalize(moduleId);
    const relative = path.relative(this.#bundleOutputRoot, normalized);
    if (
      !relative ||
      path.isAbsolute(relative) ||
      relative === '..' ||
      relative.startsWith(`..${path.sep}`)
    ) {
      throw new Error(
        `${color.dim('[rsbuild:runner]')} Bundle module is outside the output root: ${moduleId}`,
      );
    }
    return normalized;
  }

  #transformBundleModule(moduleId: string): Promise<string> {
    const source = this.#readFileSync(moduleId);
    let sourceMapUrl: string | undefined;
    for (const match of source.matchAll(SOURCE_MAP_COMMENT)) {
      sourceMapUrl = (match[1] ?? match[2])?.trim();
    }

    let sourceMap: string | undefined;
    if (sourceMapUrl) {
      const dataUrlMatch = SOURCE_MAP_DATA_URL.exec(sourceMapUrl);
      if (dataUrlMatch) {
        sourceMap = dataUrlMatch[1]
          ? Buffer.from(dataUrlMatch[2], 'base64').toString()
          : decodeURIComponent(dataUrlMatch[2]);
      } else {
        const resolvedUrl = new URL(sourceMapUrl, pathToFileURL(moduleId));
        if (resolvedUrl.protocol === 'file:') {
          sourceMap = this.#readFileSync(fileURLToPath(resolvedUrl));
        }
      }
    }

    return transformToSystemJs(
      {
        path: moduleId,
        source,
        sourceMap,
      },
      experiments.swc.transform as SwcTransform,
    );
  }

  #processImport(
    namespace: Namespace,
    specifier: string,
    metadata?: SystemJsImportMetadata,
  ): Namespace {
    analyzeImportedModDifference(namespace, specifier, metadata);
    return namespace;
  }

  #resolveExternalModuleId(specifier: string, importer: string): string {
    if (isBuiltin(specifier) || /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(specifier)) {
      return specifier;
    }
    if (path.isAbsolute(specifier)) {
      return pathToFileURL(specifier).href;
    }

    const result = new experiments.resolver.ResolverFactory({
      conditionNames: ['node', 'import', 'default'],
      mainFields: ['module', 'main'],
    }).sync(path.dirname(importer), specifier);
    if (!result.path) {
      throw new Error(
        `${color.dim('[rsbuild:runner]')} Cannot resolve external module '${specifier}' imported from ${importer}: ${result.error}`,
      );
    }
    return pathToFileURL(result.path).href;
  }

  #runExternalModule(specifier: string, importer: string): Promise<Namespace> {
    return import(
      this.#resolveExternalModuleId(specifier, importer)
    ) as Promise<Namespace>;
  }

  async #evaluateModule(
    moduleNode: SystemJsModuleNode,
    ancestors: Set<string>,
  ): Promise<void> {
    if (moduleNode.state === 'evaluated') {
      return;
    }
    if (moduleNode.state === 'failed') {
      throw moduleNode.error;
    }
    if (moduleNode.evaluationPromise) {
      if (ancestors.has(moduleNode.id)) {
        return;
      }
      return moduleNode.evaluationPromise;
    }

    const nextAncestors = new Set(ancestors);
    nextAncestors.add(moduleNode.id);
    moduleNode.state = 'evaluating';
    const promise = (async () => {
      for (const dependency of moduleNode.dependencies) {
        if (dependency.kind === 'bundle') {
          if (!nextAncestors.has(dependency.module.id)) {
            await this.#evaluateModule(dependency.module, nextAncestors);
          }
          continue;
        }

        const namespace = await this.#runExternalModule(
          dependency.specifier,
          moduleNode.id,
        );
        dependency.setter(
          this.#processImport(
            namespace,
            dependency.specifier,
            dependency.metadata,
          ),
        );
      }
      await moduleNode.execute?.();
      moduleNode.state = 'evaluated';
    })().catch((error) => {
      moduleNode.registration?.mapErrorStack(error);
      moduleNode.error = error;
      moduleNode.state = 'failed';
      throw error;
    });
    moduleNode.evaluationPromise = promise;
    return promise;
  }

  async #import(specifier: string, importer: string): Promise<Namespace> {
    const bundleModuleId = this.#resolveBundleModuleId(specifier, importer);
    if (bundleModuleId) {
      return this.evaluate(bundleModuleId);
    }
    return this.#runExternalModule(specifier, importer);
  }
}

export class SystemJsRunner implements Runner {
  readonly #options: IBasicRunnerOptions;
  readonly #evaluator: SystemJsEvaluator;

  constructor(options: IBasicRunnerOptions) {
    this.#options = options;
    this.#evaluator = new SystemJsEvaluator(options);
  }

  run(file: string): Promise<unknown> {
    return Promise.resolve(this.getRequire()(this.#options.dist, file));
  }

  getRequire(): RunnerRequirer {
    return (currentDirectory, modulePath) => {
      if (Array.isArray(modulePath)) {
        throw new Error(
          `${color.dim('[rsbuild:runner]')} Array require is not supported by the SystemJS runner.`,
        );
      }
      const request = modulePath.split('?', 1)[0];
      const absolutePath = path.isAbsolute(request)
        ? request
        : request.startsWith('.')
          ? path.resolve(currentDirectory, request)
          : path.resolve(this.#options.dist, request);
      return this.#evaluator.evaluate(absolutePath).then((namespace) => {
        const defaultValue = namespace.default;
        return defaultValue instanceof Promise ? defaultValue : namespace;
      });
    };
  }
}
