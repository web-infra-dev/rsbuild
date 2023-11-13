import path from 'path';
import { fse } from '@rsbuild/shared';
import json5 from 'json5';
import { PACKAGE_JSON, RUSH_JSON_FILE } from './constants';
import type { INodePackageJson, IRushConfig } from './types';

export const readPackageJson = async (pkgJsonFilePath: string) => {
  const packageJson = readJson<INodePackageJson>(
    pkgJsonFilePath.includes(PACKAGE_JSON)
      ? pkgJsonFilePath
      : path.join(pkgJsonFilePath, PACKAGE_JSON),
  );
  return packageJson;
};

export const readRushJson = async (rushJsonFilePath: string) => {
  const rushJson = readJson<IRushConfig>(
    rushJsonFilePath.includes(RUSH_JSON_FILE)
      ? rushJsonFilePath
      : path.join(rushJsonFilePath, RUSH_JSON_FILE),
  );
  return rushJson;
};

export const readJson = async <T>(jsonFileAbsPath: string) => {
  if (!(await fse.pathExists(jsonFileAbsPath))) {
    return {} as T;
  }

  const content = await fse.readFile(jsonFileAbsPath, 'utf-8');
  const json: T = json5.parse(content);
  return json;
};
