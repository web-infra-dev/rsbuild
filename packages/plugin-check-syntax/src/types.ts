import type { ecmaVersion as EcmaVersion } from 'acorn';

export type { EcmaVersion };

export type CheckSyntaxOptions = {
  /**
   * The target browser range of the project.
   * Its value is a standard browserslist array.
   */
  targets?: string[];
  /**
   * The minimum ECMAScript syntax version that can be used in the build artifact.
   * The priority of `ecmaVersion` is higher than `targets`.
   */
  exclude?: RegExp | RegExp[];
  /**
   * Used to exclude a portion of files during detection.
   * You can pass in one or more regular expressions to match the paths of source files.
   */
  ecmaVersion?: EcmaVersion;
};

export type CheckSyntaxExclude = NonNullable<CheckSyntaxOptions['exclude']>;

export interface Location {
  line: number;
  column: number;
}

export interface File {
  path: string;
  line: number;
  column: number;
}

interface SyntaxErrorOptions {
  source: File & { code: string };
  output?: File;
}

export class ECMASyntaxError extends Error {
  source: File & { code: string };

  output: File | undefined;

  constructor(message: string, options: SyntaxErrorOptions) {
    super(message);
    this.source = options.source;
    this.output = options.output;
  }
}

export type AcornParseError = {
  message: string;
  pos: number;
  loc: Location;
};
