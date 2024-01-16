import fs from 'fs';
import { join } from 'path';
import { getNodeEnv, isFileSync } from '@rsbuild/shared';
import { parse } from '../compiled/dotenv';
import { expand } from '../compiled/dotenv-expand';

export const getEnvFiles = () => {
  const nodeEnv = getNodeEnv();
  return ['.env', '.env.local', `.env.${nodeEnv}`, `.env.${nodeEnv}.local`];
};

export function loadEnv({
  cwd = process.cwd(),
  prefixes = ['PUBLIC_'],
}: { cwd?: string; prefixes?: string[] } = {}) {
  const envPaths = getEnvFiles()
    .map((filename) => join(cwd, filename))
    .filter(isFileSync);

  const parsed: Record<string, string> = {};
  envPaths.forEach((envPath) => {
    Object.assign(parsed, parse(fs.readFileSync(envPath)));
  });

  expand({ parsed });

  const publicVars: Record<string, string> = {};

  Object.keys(process.env).forEach((key) => {
    const val = process.env[key];
    if (val && prefixes.some((prefix) => key.startsWith(prefix))) {
      publicVars[`process.env.${key}`] = JSON.stringify(val);
    }
  });

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    Object.keys(parsed).forEach((key) => {
      if (process.env[key] === parsed[key]) {
        delete process.env[key];
      }
    });
    cleaned = true;
  };

  return {
    parsed,
    publicVars,
    cleanup,
  };
}
