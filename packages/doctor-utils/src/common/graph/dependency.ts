import { Rule, SDK } from '@rsbuild/doctor-types';

export function getDependencyByPackageData(
  dep: Rule.DependencyWithPackageData,
  dependencies: SDK.DependencyData[],
) {
  return dependencies.find((item) => item.id === dep.dependencyId);
}

export function getDependenciesByModule(
  module: SDK.ModuleData,
  dependencies: SDK.DependencyData[],
) {
  return module.dependencies
    .map((id) => dependencies.find((dep) => dep.id === id)!)
    .filter(Boolean);
}

export function getDependencyByResolvedRequest(
  resolvedRequest: string,
  dependencies: SDK.DependencyData[],
) {
  return dependencies.find((e) => e.resolvedRequest === resolvedRequest);
}
