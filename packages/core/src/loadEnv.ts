import fs from 'node:fs';
import { join } from 'node:path';
import { parse } from 'dotenv';
import { expand } from 'dotenv-expand';
import { getNodeEnv, isFileSync } from './helpers';
import { logger } from './logger';

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
  /** All env variables in the .env file */
  parsed: Record<string, string>;
  /** The absolute paths to all env files */
  filePaths: string[];
  /**
   * Env variables that start with prefixes.
   *
   * @example
   * ```ts
   * {
   *   PUBLIC_FOO: 'bar',
   * }
   * ```
   **/
  rawPublicVars: Record<string, string | undefined>;
  /**
   * Formatted env variables that start with prefixes.
   * The keys contain the prefixes `process.env.*` and `import.meta.env.*`.
   * The values are processed by `JSON.stringify`.
   *
   * @example
   * ```ts
   * {
   *   'process.env.PUBLIC_FOO': '"bar"',
   *   'import.meta.env.PUBLIC_FOO': '"bar"',
   * }
   * ```
   **/
  publicVars: Record<string, string>;
  /** Clear the env variables mounted on `process.env` */
  cleanup: () => void;
} {
  if (mode === 'local') {
    throw new Error(
      `[rsbuild:loadEnv] 'local' cannot be used as a value for env mode, because ".env.local" represents a temporary local file. Please use another value.`,
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
    logger.debug('Loaded env file:', envPath);
  }

  // dotenv-expand does not override existing env vars by default,
  // but we should allow overriding NODE_ENV, which is very common.
  // https://github.com/web-infra-dev/rsbuild/issues/2904
  if (parsed.NODE_ENV) {
    process.env.NODE_ENV = parsed.NODE_ENV;
  }

  expand({ parsed });

  const publicVars: Record<string, string> = {};
  const rawPublicVars: Record<string, string | undefined> = {};

  for (const key of Object.keys(process.env)) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      const val = process.env[key];
      publicVars[`import.meta.env.${key}`] = JSON.stringify(val);
      publicVars[`process.env.${key}`] = JSON.stringify(val);
      rawPublicVars[key] = val;
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
    rawPublicVars,
  };
}
