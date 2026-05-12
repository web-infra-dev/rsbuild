import type { Externals } from '@rspack/core';
import { isPlainObject } from '../helpers';
import { readPackageJson, type PackageJson } from '../helpers/packageJson';
import type { AutoExternal, RsbuildPlugin } from '../types';

type DependencyType =
  | 'dependencies'
  | 'optionalDependencies'
  | 'peerDependencies'
  | 'devDependencies';

type ExternalItem = Extract<Externals, unknown[]>[number];

const dependencyTypes: DependencyType[] = [
  'dependencies',
  'peerDependencies',
  'devDependencies',
  'optionalDependencies',
];

const defaultAutoExternalOptions = {
  dependencies: true,
  optionalDependencies: true,
  peerDependencies: true,
  devDependencies: false,
};

const escapeRegExp = (str: string): string =>
  str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');

export const composeAutoExternalRules = (options: {
  autoExternal?: AutoExternal;
  pkgJson?: PackageJson;
  userExternals?: Externals;
}): (string | RegExp)[] | undefined => {
  const { autoExternal, pkgJson, userExternals } = options;

  if (autoExternal === undefined || autoExternal === false) {
    return undefined;
  }

  const externalOptions = {
    ...defaultAutoExternalOptions,
    ...(autoExternal === true ? {} : autoExternal),
  };

  if (!dependencyTypes.some((type) => externalOptions[type])) {
    return undefined;
  }

  if (!pkgJson) {
    return undefined;
  }

  // User externals configuration has higher priority than autoExternal.
  // Only object externals can be safely deduplicated by request name.
  const userExternalKeys = isPlainObject(userExternals)
    ? Object.keys(userExternals)
    : [];

  const externals = dependencyTypes
    .reduce<string[]>((prev, type) => {
      if (externalOptions[type]) {
        const deps = pkgJson[type];
        return deps ? prev.concat(Object.keys(deps)) : prev;
      }
      return prev;
    }, [])
    .filter((name) => !userExternalKeys.includes(name));

  const uniqueExternals = Array.from(new Set(externals));

  return uniqueExternals.length
    ? [
        // Exclude dependencies and subpath imports, e.g. `react`, `react/jsx-runtime`.
        ...uniqueExternals.map(
          (dep) => new RegExp(`^${escapeRegExp(dep)}($|\/|\\\\)`),
        ),
        ...uniqueExternals,
      ]
    : undefined;
};

const mergeExternals = (
  userExternals: Externals | undefined,
  autoExternalRules: (string | RegExp)[] | undefined,
): Externals | undefined => {
  if (!autoExternalRules?.length) {
    return userExternals;
  }

  if (!userExternals) {
    return autoExternalRules;
  }

  return Array.isArray(userExternals)
    ? [...(userExternals as ExternalItem[]), ...autoExternalRules]
    : [userExternals as ExternalItem, ...autoExternalRules];
};

export function pluginExternals(): RsbuildPlugin {
  return {
    name: 'rsbuild:externals',
    setup(api) {
      const pkgJson = readPackageJson(api.context.rootPath);
      let hasWarnedReadPackageJsonFailed = false;

      api.modifyBundlerChain((chain, { environment }) => {
        const { autoExternal, externals } = environment.config.output;

        if (autoExternal && !pkgJson && !hasWarnedReadPackageJsonFailed) {
          api.logger.warn(
            'The `output.autoExternal` configuration will not be applied because reading package.json failed.',
          );
          hasWarnedReadPackageJsonFailed = true;
        }

        const autoExternalRules = composeAutoExternalRules({
          autoExternal,
          pkgJson,
          userExternals: externals,
        });
        const mergedExternals = mergeExternals(externals, autoExternalRules);

        if (mergedExternals) {
          chain.externals(mergedExternals);
        }
      });

      api.onBeforeCreateCompiler(({ bundlerConfigs }) => {
        for (const config of bundlerConfigs) {
          const isWebWorker = Array.isArray(config.target)
            ? config.target.includes('webworker')
            : config.target === 'webworker';

          // externals will not take effect, the Worker environment can not access global variables.
          if (isWebWorker && config.externals) {
            delete config.externals;
          }
        }
      });
    },
  };
}
