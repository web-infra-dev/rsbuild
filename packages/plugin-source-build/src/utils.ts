import fs from 'node:fs';
import path from 'node:path';
import json5 from 'json5';
import { RUSH_JSON_FILE } from './constants';
import type { INodePackageJson, IRushConfig } from './types';

export const readPackageJson = async (
  pkgJsonFilePath: string,
): Promise<INodePackageJson> => {
  return readJson<INodePackageJson>(pkgJsonFilePath);
};

export const readRushJson = async (
  rushJsonFilePath: string,
): Promise<IRushConfig> => {
  const rushJson = readJson<IRushConfig>(
    rushJsonFilePath.includes(RUSH_JSON_FILE)
      ? rushJsonFilePath
      : path.join(rushJsonFilePath, RUSH_JSON_FILE),
  );
  return rushJson;
};

async function pathExists(path: string) {
  return fs.promises
    .access(path)
    .then(() => true)
    .catch(() => false);
}

export const readJson = async <T>(jsonFileAbsPath: string): Promise<T> => {
  if (!(await pathExists(jsonFileAbsPath))) {
    return {} as T;
  }

  const content = await fs.promises.readFile(jsonFileAbsPath, 'utf-8');
  const json: T = json5.parse(content);
  return json;
};
