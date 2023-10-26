import { Common } from '@rsbuild/doctor-types';
import fse from 'fs-extra';

const cache = new Map<string, string>();

export async function readFile(path: string): Promise<string> {
  if (cache.has(path)) return cache.get(path)!;

  const res = await fse.readFile(path, 'utf-8');

  cache.set(path, res);

  return res;
}

export function readFileSync(path: string): string {
  if (cache.has(path)) return cache.get(path)!;

  const res = fse.readFileSync(path, 'utf-8');

  cache.set(path, res);

  return res;
}

export async function readJSON<T extends Common.PlainObject>(
  path: string,
): Promise<T> {
  const str = await readFile(path);

  return JSON.parse(str);
}

export function readJSONSync<T extends Common.PlainObject>(path: string): T {
  const str = readFileSync(path);

  return JSON.parse(str);
}
