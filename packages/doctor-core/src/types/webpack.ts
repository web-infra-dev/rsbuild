import {
  Compiler,
  Compilation,
  LoaderDefinitionFunction,
  ModuleGraph,
  Dependency,
} from 'webpack';

type GetMapValue<M extends Map<any, any>> = M extends Map<string, infer V>
  ? V
  : never;

export type NormalModuleFactory = ReturnType<
  Compiler['createNormalModuleFactory']
>;
export type SourceMapInput = Parameters<LoaderDefinitionFunction>[1];
export type SourceMap = Exclude<SourceMapInput, string | undefined>;
export type EntryPoint = GetMapValue<Compilation['entrypoints']>;
export type ExportInfo = ReturnType<ModuleGraph['getExportInfo']>;
export type ExportsInfo = ReturnType<ModuleGraph['getExportsInfo']>;

export interface HarmonyImportSpecifierDependency extends Dependency {
  getIds(graph: ModuleGraph): string[];
  name: string;
  userRequest: string;
}
