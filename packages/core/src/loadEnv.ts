import fs from 'node:fs';
import { join } from 'node:path';
import { parse } from 'dotenv';
import { expand } from 'dotenv-expand';
import { getNodeEnv, isFileSync } from './helpers';

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
  if (mode === 'local') {
    throw new Error(
      `'local' cannot be used as a value for env mode, because ".env.local" represents a temporary local file. Please use another value.`,
    );
  }

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

  for (const envPath of filePaths) {
    Object.assign(parsed, parse(fs.readFileSync(envPath)));
  }

  expand({ parsed });

  const publicVars: Record<string, string> = {};

  for (const key of Object.keys(process.env)) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      const val = process.env[key];
      publicVars[`import.meta.env.${key}`] = JSON.stringify(val);
      publicVars[`process.env.${key}`] = JSON.stringify(val);
    }
  }

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) {
      return;
    }

    for (const key of Object.keys(parsed)) {
      // do not cleanup NODE_ENV,
      // otherwise the .env.${mode} file will not be loaded
      if (key === 'NODE_ENV') {
        continue;
      }

      if (process.env[key] === parsed[key]) {
        delete process.env[key];
      }
    }

    cleaned = true;
  };

  return {
    parsed,
    cleanup,
    filePaths,
    publicVars,
  };
}
