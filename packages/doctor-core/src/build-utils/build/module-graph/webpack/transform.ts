import type { SourceMapConsumer } from 'source-map';
import * as Webpack from 'webpack';
import { File } from '@rsbuild/doctor-utils';
import { Node } from '@rsbuild/doctor-utils/ruleUtils';
import { Plugin } from '@rsbuild/doctor-types';
import { Module, ModuleGraph, PackageData } from '@rsbuild/doctor-sdk/graph';
import {
  getAllModules,
  getDependencyPosition,
  getModuleExportsType,
  getResolveModule,
  getWebpackDependencyRequest,
  getWebpackModuleId,
  getWebpackModulePath,
  isExternalModule,
} from '@/build-utils/common/webpack/compatible';
import {
  getImportKind,
  isImportDependency,
  removeNoImportStyle,
} from '@/build-utils/common/module-graph';
import { hasSetEsModuleStatement } from '../parser';

export interface TransformContext {
  astCache?: Map<Webpack.NormalModule, Node.Program>;
  packagePathMap?: Map<string, string>;
  getSourceMap?(module: string): Promise<SourceMapConsumer | undefined>;
}

type WebpackFs = Webpack.Compilation['fileSystemInfo'];

async function readFile(target: string, wbFs: WebpackFs) {
  if (wbFs?.fs?.readFile) {
    const result = new Promise<Buffer | void>((resolve, reject) => {
      wbFs.fs.readFile(target, (err, content) => {
        if (err) {
          reject(err);
          return;
        }

        if (content) {
          resolve(Buffer.from(content));
        } else {
          resolve();
        }
      });
    }).catch(() => {});

    if (result) {
      return result;
    }
  }

  return File.fse.readFile(target).catch(() => {});
}

function appendDependency(
  webpackDep: Webpack.Dependency,
  module: Module,
  webpackGraph: Webpack.ModuleGraph,
  graph: ModuleGraph,
) {
  const resolvedWebpackModule = getResolveModule(
    webpackDep,
    webpackGraph,
  ) as Webpack.NormalModule;
  if (!resolvedWebpackModule) {
    return;
  }
  const rawRequest = getWebpackDependencyRequest(
    webpackDep,
    resolvedWebpackModule,
  );
  const resolveRequest = getWebpackModulePath(resolvedWebpackModule);
  const request = rawRequest ?? resolveRequest;

  if (!module.getDependencyByRequest(request)) {
    const depModule = graph.getModuleByFile(resolveRequest);

    if (depModule) {
      const dep = module.addDependency(
        request,
        depModule,
        getImportKind(webpackDep),
      );

      if (dep) {
        graph.addDependency(dep);
      }
    }
  }

  const dependency = module.getDependencyByRequest(request);

  if (dependency) {
    dependency.setBuildMeta({
      exportsType: getModuleExportsType(
        resolvedWebpackModule,
        webpackGraph,
        module.meta.strictHarmonyModule,
      ),
    });

    const statement = getDependencyPosition(webpackDep, module, false);

    if (statement) {
      dependency.addStatement(statement);
    }

    // Update statement position.
    dependency.statements.forEach((state) => {
      state.position.source = state.module.getSourceRange(
        state.position.transformed,
      );
    });
  }
}

function getModuleSource(
  modulePath: string,
  wbFs: WebpackFs,
  sourceMap?: SourceMapConsumer,
) {
  if (sourceMap) {
    try {
      const contentFromSourceMap = sourceMap.sourceContentFor(modulePath);

      if (contentFromSourceMap) {
        return Buffer.from(contentFromSourceMap);
      }
    } catch (e) {
      // ..
    }
  }

  return process.env.NODE_ENV === 'test'
    ? Buffer.from('test code')
    : readFile(modulePath, wbFs);
}

async function appendModuleData(
  origin: Webpack.NormalModule,
  webpackGraph: Webpack.ModuleGraph,
  graph: ModuleGraph,
  wbFs: WebpackFs,
  features?: Plugin.DoctorWebpackPluginFeatures,
  context?: TransformContext,
) {
  const module = graph.getModuleByWebpackId(getWebpackModuleId(origin));

  if (!origin || !module) {
    return;
  }

  const { getSourceMap, astCache, packagePathMap } = context ?? {};

  try {
    const sourceMap = await getSourceMap?.(module.path);
    const source =
      (await getModuleSource(module.path, wbFs, sourceMap)) ?? Buffer.from('');

    if (sourceMap) {
      module.setSourceMap(sourceMap);
    }

    if (astCache?.has(origin)) {
      const program = astCache.get(origin)!;
      module.setProgram(program);
      module.meta.hasSetEsModuleStatement = hasSetEsModuleStatement(program);
    }

    const transformed = isExternalModule(origin)
      ? ''
      : module.getSource().transformed.length > 0
      ? module.getSource().transformed
      : origin.originalSource?.()?.source().toString() ?? '';
    const transformedSize = isExternalModule(origin)
      ? 0
      : module.getSize().transformedSize > 0
      ? module.getSize().transformedSize
      : Buffer.from(transformed).byteLength;

    module.setSource({
      transformed,
      source: source.toString(),
    });

    module.setSize({
      transformedSize,
      sourceSize: source.byteLength,
    });

    let packageData: PackageData | undefined;

    if (packagePathMap && origin.resourceResolveData) {
      let { descriptionFileRoot: root } = origin.resourceResolveData;
      const { descriptionFileData: data } = origin.resourceResolveData;

      if (root && data.name && data.version) {
        if (packagePathMap.has(root)) {
          root = packagePathMap.get(root)!;
        } else {
          const realpath = await File.fse.realpath(root);
          root = realpath;
          packagePathMap.set(root, realpath);
        }

        packageData = {
          ...origin.resourceResolveData.descriptionFileData,
          root,
        };
      }
    }

    module.meta.strictHarmonyModule =
      origin.buildMeta?.strictHarmonyModule ?? false;
    module.meta.packageData = packageData;

    if (!features?.lite) {
      // lite bundle Mode don't have dependency；
      // Record dependent data.
      Array.from(origin.dependencies)
        // Filter self-dependence and empty dependencies.
        .filter((item) => isImportDependency(item))
        // Merge asynchronous dependencies.
        .concat(
          origin.blocks.reduce(
            (ans, item) => ans.concat(item.dependencies),
            [] as Webpack.Dependency[],
          ),
        )
        // Record dependent data.
        .forEach((dep) => appendDependency(dep, module, webpackGraph, graph));
    }
  } catch (e) {
    console.error(`module ${module.path} transform has error:`, e);
  }
}

export async function appendModuleGraphByCompilation(
  compilation: Plugin.BaseCompilation,
  graph: ModuleGraph,
  features?: Plugin.DoctorWebpackPluginFeatures,
  context?: TransformContext,
) {
  try {
    // Rspack does not follow webpack graph logic, which affects tree-shaking analysis
    if (
      'rspackVersion' in compilation.compiler &&
      compilation.compiler.rspackVersion
    ) {
      return graph;
    }

    // Only webpack will execute the following logic.
    const { moduleGraph: webpackGraph, fileSystemInfo } =
      compilation as Webpack.Compilation;
    const allModules = getAllModules(compilation as Webpack.Compilation);

    await Promise.all(
      allModules.map((module: Webpack.NormalModule) => {
        return appendModuleData(
          module,
          webpackGraph,
          graph,
          fileSystemInfo,
          features,
          context,
        );
      }),
    );

    removeNoImportStyle(graph);
    return graph;
  } catch (e) {
    return graph;
  }
}
