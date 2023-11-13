import path from 'path';
import bytes from 'bytes';
import type { SDK, Rule } from '@rsbuild/doctor-types';

export function getErrorMsg(
  packages: SDK.PackageInstance[],
  root: string,
): string {
  const pkgName = packages[0].name;

  let message = `Multiple packages of ${pkgName} found:\n`;

  for (const pkg of packages) {
    message += `  ${pkg.version} ${bytes(
      pkg.getSize().parsedSize,
    )} ${path.relative(root, pkg.root)}\n`;
  }

  return message.slice(0, -1);
}

export function getErrorDetail(
  pkg: SDK.PackageInstance,
  pkgGraph: SDK.PackageGraphInstance,
): Rule.PackageRelationData {
  function getImported(
    pkg: SDK.PackageInstance,
    ans: SDK.PackageDependencyInstance[],
  ): SDK.PackageDependencyInstance[] {
    const dependencies = pkgGraph.getDependenciesFromPackage(pkg);

    for (const dep of dependencies) {
      if (!dep.refDependency) {
        continue;
      }

      // The circular reference jumps out.
      if (ans.some((dep) => dep.dependency === pkg)) {
        continue;
      }

      // Go to the user code and end the query
      if (!dep.package) {
        return ans.concat(dep);
      }

      return getImported(dep.package, ans.concat(dep));
    }

    return ans;
  }

  const packageImportLinks = getImported(pkg, []);

  return {
    target: {
      name: pkg.name,
      version: pkg.version,
      root: pkg.root,
    },
    targetSize: {
      sourceSize: pkg.getSize().sourceSize,
      parsedSize: pkg.getSize().parsedSize,
    },
    dependencies: packageImportLinks.map((item) => {
      return {
        dependencyId: item.refDependency.id,
        group: item.package
          ? `${item.package.name}@${item.package.version}`
          : undefined,
      };
    }),
  };
}
