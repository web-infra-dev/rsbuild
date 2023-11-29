import fs from 'fs';
import { join } from 'path';
import { isFileSync } from '@rsbuild/shared';

export async function loadEnv({
  dir = process.cwd(),
  prefixes = ['PUBLIC_'],
}: { dir?: string; prefixes?: string[] } = {}) {
  const { parse } = await import('../compiled/dotenv');
  const { expand } = await import('../compiled/dotenv-expand');

  const { NODE_ENV } = process.env;
  const files = [
    '.env',
    '.env.local',
    `.env.${NODE_ENV}`,
    `.env.${NODE_ENV}.local`,
  ];

  const envPaths = files
    .map((filename) => join(dir, filename))
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

  return {
    parsed,
    publicVars,
  };
}
