import { Rule, SDK } from '@rsbuild/doctor-types';
import { relative } from 'path';

export function getPackageRelationAlertDetails(
  modules: SDK.ModuleGraphData['modules'],
  dependencies: SDK.ModuleGraphData['dependencies'],
  root: string,
  packageDependencies: Rule.DependencyWithPackageData[],
  moduleCodeMap: SDK.ModuleCodeData,
): SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetPackageRelationAlertDetails> {
  return packageDependencies
    .slice()
    .reverse()
    .map((dep) => {
      const dependency = dependencies.find(
        (item) => item.id === dep.dependencyId,
      );

      if (!dependency) {
        return null!;
      }

      const module = modules.find((item) => item.id === dependency.module);

      if (!module) {
        return null!;
      }

      return {
        group: dep.group,
        module,
        dependency,
        relativePath: relative(root, module.path),
        moduleCode: moduleCodeMap?.[module.id],
      };
    })
    .filter(Boolean);
}
