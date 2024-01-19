import fs from 'fs';
import { join } from 'path';
import { getNodeEnv, isFileSync } from '@rsbuild/shared';
import { parse } from '../compiled/dotenv';
import { expand } from '../compiled/dotenv-expand';

export type LoadEnvOptions = {
  /**
   * The root path to load the env file
   * @default process.cwd()
   */
  cwd?: string;
  /**
   * Used to specify the name of the .env.[mode] file
   * @default process.env.NODE_ENV
   */
  mode?: string;
  /**
   * The prefix of public variables
   * @default ['PUBLIC_']
   */
  prefixes?: string[];
};

export function loadEnv({
  cwd = process.cwd(),
  mode = getNodeEnv(),
  prefixes = ['PUBLIC_'],
}: LoadEnvOptions = {}): {
  /** All environment variables in the .env file */
  parsed: Record<string, string>;
  /** The absolute paths to all env files */
  filePaths: string[];
  /** Environment variables that start with prefixes */
  publicVars: Record<string, string>;
  /** Clear the environment variables mounted on `process.env` */
  cleanup: () => void;
} {
  const filenames = [
    '.env',
    '.env.local',
    `.env.${mode}`,
    `.env.${mode}.local`,
  ];

  const filePaths = filenames
    .map((filename) => join(cwd, filename))
    .filter(isFileSync);

  const parsed: Record<string, string> = {};

  filePaths.forEach((envPath) => {
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
    cleanup,
    filePaths,
    publicVars,
  };
}
