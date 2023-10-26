import type { NonFunctionProperties } from './common';
import type { BaseRuleStoreData } from './rule';

/**
 * Position
 *   - `line` start with `1`
 *   - `column` start with `0`
 */
export interface Position {
  line: number;
  column: number;
}

/** Range of Position */
export interface Range {
  start: Position;
  end: Position;
}

/** Offset range  */
export interface OffsetRange {
  start: number;
  end: number;
}

/** Error Level */
export enum ErrorLevel {
  Ignore,
  Warn,
  Error,
}

/** Code prompt location */
export interface CodeFramePosition {
  line: number;
  column?: number;
}

/** File options where the code is located */
export interface CodeFrameFileOption {
  filePath: string;
}

/** Code indication options */
export interface CodeFrameNormalOption {
  filePath: string;
  fileContent: string;
  start?: CodeFramePosition;
  end?: CodeFramePosition;
}

/**
 * Code indication options
 *   - This type is mainly for compatibility with esbuild.
 */
export interface CodeFrameLineOption {
  /** File path */
  filePath: string;
  /** Error line text */
  lineText: string;
  /** Starting point */
  start?: CodeFramePosition;
  /** Error character length */
  length?: number;
}

export type CodeFrameOption =
  | CodeFrameFileOption
  | CodeFrameNormalOption
  | CodeFrameLineOption;

/** Control item */
export interface ControllerOption {
  /**
   * Hide stack information
   *   - default is `true`
   */
  noStack?: boolean;
  /**
   * Do not display colors
   *   - default is `false`
   */
  noColor?: boolean;
}

/** repair data */
export interface FixData {
  /** Modify the starting position of string in the original text. */
  start: number;
  /** Modify string in the key position of the original text */
  end: number;
  /**
   * Replaced new text
   *   - If empty, delete the original text.
   */
  newText?: string;
  /** Has it been fixed */
  isFixed?: boolean;
}

/** Error Data */
export interface DevToolErrorData {
  /** Error number */
  id: number;
  /** Wrong code */
  code?: string;
  /** Error category */
  category?: string;
  title: string;
  message: string;
  stack?: string;
  fixData?: FixData;
  detail?: any;
  /** Absolute path where the error is located. */
  path?: string;
  /**
   * Error level
   *   - default is `'Error'`
   */
  level?: keyof typeof ErrorLevel;
  /** Error prompt */
  hint?: string;
  /** Description link */
  referenceUrl?: string;
  codeFrame?: CodeFrameOption;
}

/**  Error data */
export interface DevToolErrorInstance extends DevToolErrorData {
  /** Output stored data */
  toData(): BaseRuleStoreData;
  toString(): string;
  toJSON(): {
    message: string;
    name: string;
    stack?: string;
  };
  /** Set control items */
  setControllerOption(opt: ControllerOption): void;
  /** Set code instructions */
  setCodeFrame(opt: CodeFrameOption): void;
  /** Is the error the same */
  isSame<T extends DevToolErrorInstance>(error: T): boolean;
}

export interface DevToolErrorsData {
  errors: DevToolErrorInstance[];
  warnings: DevToolErrorInstance[];
}

/** Incorrect data input */
export type DevToolErrorParams = Omit<
  NonFunctionProperties<DevToolErrorInstance>,
  'message' | 'title' | 'path' | 'id'
> & {
  controller?: ControllerOption;
  codeFrame?: CodeFrameOption;
};
