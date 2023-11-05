import type { SDK } from '@rsbuild/doctor-types';
import { unionBy } from 'lodash';
import {
  ModuleGraph as SdkModuleGraph,
  Module as SdkModule,
  Statement,
} from '@rsbuild/doctor-sdk/graph';
import {
  Compilation,
  Dependency,
  ExternalModule,
  Module,
  ModuleGraph,
  NormalModule,
} from 'webpack';
import type { EntryPoint, ExportInfo } from '@/types/index';

export function isNormalModule(mod: Module): mod is NormalModule {
  return 'request' in mod && 'rawRequest' in mod && 'resource' in mod;
}

export function getWebpackModuleId(mod: Module): string {
  return mod.identifier();
}

export function getWebpackModulePath(mod: NormalModule): string {
  return mod.resource ?? mod.nameForCondition?.() ?? getWebpackModuleId(mod);
}

export function getWebpackDependencyRequest(
  dep: Dependency,
  module?: NormalModule,
): string {
  return (dep as any).request ?? (dep as any).userRequest ?? module?.rawRequest;
}

export function getResolveRequest(dep: Dependency, graph: ModuleGraph) {
  return getWebpackModulePath(graph.getResolvedModule(dep) as NormalModule);
}

export function isExternalModule(mod: Module): mod is ExternalModule {
  return Boolean((mod as any).externalType);
}

export function getModuleSource(mod: NormalModule): string {
  return isExternalModule(mod)
    ? ''
    : mod.originalSource?.()?.source().toString() ?? '';
}

export function getResolveModule(dep: Dependency, graph?: ModuleGraph) {
  // webpack5
  if (graph) {
    return graph.getResolvedModule(dep);
  }

  // webpack4
  return (dep.module as Module) ?? undefined;
}

export function getEntryModule(
  entryMap: Map<string, EntryPoint>,
): NormalModule[] {
  return Array.from(entryMap.values())
    .map((entry) => entry.getRuntimeChunk())
    .map((chunk) => (chunk ? chunk.entryModule : null))
    .filter(Boolean)
    .map((mod) => (isNormalModule(mod!) ? mod : (mod as any).rootModule));
}

/**
 * Get the type of dependencies between modules.
 * This property can determine what runtime webpack has added to the modules.
 * In webpack 5, it can be directly obtained using internal APIs.
 * In webpack 4, manual conversion is required. Since webpack 4 is not as strict as webpack 5 in terms of compatibility, we can follow the logic of webpack 5 here.
 */
export function getModuleExportsType(
  module: NormalModule,
  moduleGraph?: ModuleGraph,
  strict = false,
): SDK.DependencyBuildMeta['exportsType'] {
  // webpack5
  // https://github.com/webpack/webpack/blob/v5.75.0/lib/RuntimeTemplate.js#L771
  if (moduleGraph) {
    return module.getExportsType(moduleGraph, strict);
  }

  // webpack4
  // https://github.com/webpack/webpack/blob/v4.46.0/lib/RuntimeTemplate.js#L215
  const exportsType = module.buildMeta && module.buildMeta.exportsType;

  if (!exportsType && !strict) {
    return 'dynamic';
  }

  // @ts-ignore
  if (exportsType === 'named') {
    return 'namespace';
  }

  return strict ? 'default-with-named' : 'dynamic';
}

export function getDependencyPosition(
  dep: Dependency,
  module: SdkModule,
  getSource = true,
): Statement | undefined {
  const { loc: depLoc } = dep;

  if (!('start' in depLoc)) {
    return;
  }

  const transformed = {
    start: {
      line: depLoc.start.line,
      column: depLoc.start.column,
    },
    end: depLoc.end
      ? {
          line: depLoc.end.line,
          column: depLoc.end.column,
        }
      : undefined,
  };
  const statement = new Statement(module, {
    source: getSource ? module.getSourceRange(transformed) : undefined,
    transformed,
  });

  return statement;
}

export function getExportDependency(info: ExportInfo, module: NormalModule) {
  let dep = module.dependencies.find((dep) => {
    // TODO: type
    return (
      (dep as any).name === info.name &&
      (dep.type === 'harmony export imported specifier' ||
        dep.type === 'harmony export specifier')
    );
  });

  if (!dep && (info as any)._target && (info as any)._target.size > 0) {
    dep = (info as any)._getMaxTarget().values().next().value
      .connection.dependency;
  }

  return dep;
}

export function getSdkDependencyByWebpackDependency(
  dep: Dependency,
  module: NormalModule,
  graph: SdkModuleGraph,
) {
  const modulePath = getWebpackModulePath(module);
  const request = getWebpackDependencyRequest(dep);
  return graph
    .getDependencies()
    .find(
      (item) => item.module.path === modulePath && item.request === request,
    );
}

export function getExportStatement(
  info: ExportInfo,
  normalModule: NormalModule,
  graph: SdkModuleGraph,
) {
  const webpackDependency = getExportDependency(info, normalModule);

  if (!webpackDependency) {
    return;
  }

  const modulePath = getWebpackModulePath(normalModule);
  const request = getWebpackDependencyRequest(webpackDependency);
  const sdkDependency = graph
    .getDependencies()
    .find(
      (item) => item.module.path === modulePath && item.request === request,
    );

  if (sdkDependency && sdkDependency.statements.length === 1) {
    return sdkDependency.statements[0];
  }

  // TODO: When there are multiple statements, the transform position can be matched, and there is no need to calculate it again.
  const sdkModule = graph.getModuleByWebpackId(
    getWebpackModuleId(normalModule),
  );

  if (sdkModule) {
    return getDependencyPosition(webpackDependency, sdkModule);
  }
}

export function getLastExportInfo(
  info: ExportInfo,
  webpackGraph: ModuleGraph,
): ExportInfo | undefined {
  const target = info.findTarget(webpackGraph, () => true);

  if (!target || !target.export) {
    return;
  }

  const exportsInfo = webpackGraph.getExportsInfo(target.module);
  const lastInfo = exportsInfo.getExportInfo(target.export[0]);

  return lastInfo;
}

export function getAllModules(compilation: Compilation) {
  const modules: NormalModule[] = [];

  for (const mod of compilation.modules) {
    modules.push(...((mod as any).modules ?? []));
    modules.push(mod as NormalModule);
  }

  return unionBy(
    modules.filter(
      (mod) => !getWebpackModuleId(mod).startsWith('webpack/runtime'),
    ),
    (mod) => getWebpackModuleId(mod),
  );
}
