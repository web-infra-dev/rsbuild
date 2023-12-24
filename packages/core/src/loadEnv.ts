import fs from 'fs';
import { join } from 'path';
import { isDev, isFileSync } from '@rsbuild/shared';
import { onBeforeRestartServer } from './server/restart';
import { parse } from '../compiled/dotenv';
import { expand } from '../compiled/dotenv-expand';

export const getEnvFiles = () => {
  const { NODE_ENV } = process.env;
  return ['.env', '.env.local', `.env.${NODE_ENV}`, `.env.${NODE_ENV}.local`];
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

  // clear the assigned env vars before restarting dev server
  if (isDev()) {
    onBeforeRestartServer(() => {
      Object.keys(parsed).forEach((key) => {
        if (process.env[key] === parsed[key]) {
          delete process.env[key];
        }
      });
    });
  }

  return {
    parsed,
    publicVars,
  };
}
