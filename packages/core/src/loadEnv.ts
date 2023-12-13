import fs from 'fs';
import { join } from 'path';
import { isFileSync } from '@rsbuild/shared';

export const getEnvFiles = () => {
  const { NODE_ENV } = process.env;
  return ['.env', '.env.local', `.env.${NODE_ENV}`, `.env.${NODE_ENV}.local`];
};

let lastParsed: Record<string, string>;

export async function loadEnv({
  cwd = process.cwd(),
  prefixes = ['PUBLIC_'],
}: { cwd?: string; prefixes?: string[] } = {}) {
  const { parse } = await import('../compiled/dotenv');
  const { expand } = await import('../compiled/dotenv-expand');

  const envPaths = getEnvFiles()
    .map((filename) => join(cwd, filename))
    .filter(isFileSync);

  const parsed: Record<string, string> = {};
  envPaths.forEach((envPath) => {
    Object.assign(parsed, parse(fs.readFileSync(envPath)));
  });

  // clear the assigned env vars for reloading
  if (lastParsed) {
    Object.keys(lastParsed).forEach((key) => {
      if (process.env[key] === lastParsed[key]) {
        delete process.env[key];
      }
    });
  }

  expand({ parsed });

  const publicVars: Record<string, string> = {};

  Object.keys(process.env).forEach((key) => {
    const val = process.env[key];
    if (val && prefixes.some((prefix) => key.startsWith(prefix))) {
      publicVars[`process.env.${key}`] = JSON.stringify(val);
    }
  });

  lastParsed = parsed;

  return {
    parsed,
    publicVars,
  };
}
