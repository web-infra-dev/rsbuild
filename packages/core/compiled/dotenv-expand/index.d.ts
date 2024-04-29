/// <reference types="node" />
// TypeScript Version: 3.0

interface DotenvPopulateInput {
  [name: string]: string;
}

interface DotenvParseInput {
  [name: string]: string;
}

interface DotenvParseOutput {
  [name: string]: string;
}

interface DotenvExpandOptions {
  error?: Error;

  /**
   * Default: `process.env`
   *
   * Specify an object to write your secrets to. Defaults to process.env environment variables.
   *
   * example: `const processEnv = {}; require('dotenv').config({ processEnv: processEnv })`
   */
  processEnv?: DotenvPopulateInput;

  /**
   * Default: `object`
   *
   * Object coming from dotenv's parsed result.
   */
  parsed?: DotenvParseInput;
}

interface DotenvExpandOutput {
  error?: Error;
  parsed?: DotenvParseOutput;
}

/**
 * Adds variable expansion on top of dotenv.
 *
 * See https://docs.dotenv.org
 *
 * @param options - additional options. example: `{ processEnv: {}, error: null, parsed: { { KEY: 'value' } }`
 * @returns an object with a `parsed` key if successful or `error` key if an error occurred. example: { parsed: { KEY: 'value' } }
 *
 */
declare function expand(options?: DotenvExpandOptions): DotenvExpandOutput

export { type DotenvExpandOptions, type DotenvExpandOutput, type DotenvParseInput, type DotenvParseOutput, type DotenvPopulateInput, expand };
