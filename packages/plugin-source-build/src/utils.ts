import fs from 'node:fs';
import path from 'node:path';
import { fse } from '@rsbuild/shared';
import json5 from 'json5';
import { RUSH_JSON_FILE } from './constants';
import type { INodePackageJson, IRushConfig } from './types';

export const readPackageJson = async (pkgJsonFilePath: string) => {
  return readJson<INodePackageJson>(pkgJsonFilePath);
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

  const content = await fs.promises.readFile(jsonFileAbsPath, 'utf-8');
  const json: T = json5.parse(content);
  return json;
};
