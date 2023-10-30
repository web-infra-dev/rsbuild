import { SDK } from '@rsbuild/doctor-types';
import { isEmpty, last, compact } from 'lodash';

/**
 * The following code is modified based on
 * https://github.com/relative-ci/bundle-stats/blob/master/packages/utils/src/webpack/extract/modules-packages.ts#L24
 *
 * MIT Licensed
 * Author Viorel Cojocaru
 * Copyright 2019 Viorel Cojocaru, contributors.
 * https://github.com/relative-ci/bundle-stats/blob/master/LICENSE.md
 */
const PACKAGE_PREFIX = /(?:node_modules|~)(?:\/\.pnpm)?/;
const PACKAGE_SLUG = /[a-zA-Z0-9]+(?:[-|_|.]+[a-zA-Z0-9]+)*/;
const VERSION = /@[\w|\-|_|.]+/;
const VERSION_NUMBER = '@([\\d.]+)';

// Extract package paths from module path
// https://regex101.com/r/22Leep/6
/* eslint-disable prettier/prettier */
export const MODULE_PATH_PACKAGES = new RegExp(
  [
    // match dependency directory (eg: `node_modules/`, `node_modules/.pnpm/`)
    `(?:${PACKAGE_PREFIX.source}/)`,
    // match package name
    '(?:',
    // match `@organization/` or `@organization+`(pnpm)
    `(?:@${PACKAGE_SLUG.source}[/|+])?`,
    // match github.com+organization+
    `(?:${PACKAGE_SLUG.source}\\+)*`,
    // match package name
    `(?:${PACKAGE_SLUG.source})`,
    // match version
    `(?:${VERSION.source})?`,
    ')',

    // Match pnpm peer dependencies (eg: package-a@version_package-b@version)
    '(?:_',
    `(?:@${PACKAGE_SLUG.source}[/|+])?`,
    `(?:${PACKAGE_SLUG.source})`,
    `(?:@${PACKAGE_SLUG.source})?`,
    ')*',
    '/',
  ].join(''),
  'g',
);

// Extract package name from package path
// https://regex101.com/r/tTlU0W/6
/* eslint-disable prettier/prettier */
export const PACKAGE_PATH_NAME =
  /(?:(?:node_modules|~)(?:\/\.pnpm)?\/)(?:((?:@[a-zA-Z0-9]+(?:[-|_|.]+[a-zA-Z0-9]+)*[/|+])?(?:(?:[a-zA-Z0-9]+(?:[-|_|.]+[a-zA-Z0-9]+)*\+)*)(?:[a-zA-Z0-9]+(?:[-|_|.]+[a-zA-Z0-9]+)*))(?:@[\w|\-|_|.]+)?)(?:_((?:@[a-zA-Z0-9]+(?:[-|_|.]+[a-zA-Z0-9]+)*[/|+])?(?:[a-zA-Z0-9]+(?:[-|_|.]+[a-zA-Z0-9]+)*))(?:@[a-zA-Z0-9]+(?:[-|_|.]+[a-zA-Z0-9]+)*))*\//gm;

const uniqLast = (data: Array<unknown>) => {
  const res: Array<unknown> = [];

  data.forEach((item, index) => {
    if (!data.slice(index + 1).includes(item)) {
      res.push(item);
    }
  });

  return res;
};

/**
 * Heuristics to extract package id, name, and path from a module path
 */
export const getPackageMetaFromModulePath = (
  modulePath: string,
): SDK.PackageJSONData => {
  const paths = modulePath.match(MODULE_PATH_PACKAGES);

  // No package paths found, skip
  if (!paths) {
    return { name: '', version: '' };
  }

  // Extract package names from module path
  // @NOTE check for uniq for pnpm cases
  const names = uniqLast(
    paths.flatMap((packagePath) => {
      // @ts-ignore
      const found = packagePath.matchAll(PACKAGE_PATH_NAME);

      if (!found) {
        return [];
      }

      const paksArray = compact([...found].flat());

      return paksArray
        .slice(1)
        .filter(Boolean)
        .map((name) => name.replace(/\+/g, '/'));
    }),
  );

  // If no names, skip
  if (isEmpty(names)) {
    return { name: '', version: '' };
  }

  const name = last(names) as string;

  // Get package full path
  // @NOTE use the last path to prevent getting incorrect results on packages with similar names
  const pattern = new RegExp(`(.*)(${last(paths)}).*`);
  const path = modulePath.replace(pattern, '$1$2').replace(/\/$/, '');

  return {
    name,
    version:
      path && name
        ? path
            .match(new RegExp(`${name}${VERSION_NUMBER}`))
            ?.flat()
            .slice(1)?.[0] || ''
        : '',
  };
};
