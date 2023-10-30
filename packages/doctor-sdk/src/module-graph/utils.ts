import type { SDK } from '@rsbuild/doctor-types';
import { last, isUndefined, isNil } from 'lodash';

export function isSamePosition(
  po1: SDK.SourcePosition,
  po2: SDK.SourcePosition,
) {
  return po1.line === po2.line && po1.column === po2.column;
}

export function isSameRange(po1: SDK.SourceRange, po2: SDK.SourceRange) {
  if (!isSamePosition(po1.start, po2.start)) {
    return false;
  }

  if (!isNil(po1.end) && !isNil(po2.end)) {
    return isSamePosition(po1.end, po2.end);
  }

  return isUndefined(po1.end) && isUndefined(po2.end);
}

/**
 * The following code is modified based on
 * https://github.com/relative-ci/bundle-stats/blob/master/packages/utils/src/webpack/utils.js#L63
 *
 * MIT Licensed
 * Author Viorel Cojocaru
 * Copyright 2019 Viorel Cojocaru, contributors.
 * https://github.com/relative-ci/bundle-stats/blob/master/LICENSE.md
 */
// css ./node_modules/css-loader/dist/cjs.js??ref--6-0!./src/assets/styles/default.styl
const NAME_WITH_LOADERS = /!/;

// ./src/index.jsx + 27 modules
const NAME_WITH_MODULES = /\s\+\s\d*\smodules$/;

// css ../node_modules../node_modules/package-a
const INVALID_CSS_PREFIX = /^css\s.*node_modules(?!\/)/;

export function getModuleName(name?: string) {
  if (!name) {
    return '';
  }

  if (NAME_WITH_LOADERS.test(name)) {
    const normalizedName = last(name.split(NAME_WITH_LOADERS));

    if (normalizedName?.trim()) {
      return normalizedName;
    }
  }

  if (NAME_WITH_MODULES.test(name)) {
    return name.replace(NAME_WITH_MODULES, '');
  }

  if (INVALID_CSS_PREFIX.test(name)) {
    return name.replace(INVALID_CSS_PREFIX, '');
  }

  return name;
}
