export enum LogLevel {
  Silent,
  Error,
  Warning,
  Info,
  Debug,
  Verbose,
}

export type LogLevelName = keyof typeof LogLevel;

export interface LoggerOptions {
  /**
   * Default is `info`.
   */
  level?: LogLevelName;
  /**
   * Default is `false`.
   */
  timestamp?: boolean;
  /**
   * Default is empty string
   */
  prefix?: string;
}

type Label = string;

export abstract class LoggerInstance {
  abstract timesLog: Map<Label, number>;

  abstract info(...msg: string[]): void;

  abstract warn(...msg: string[]): void;

  abstract error(...msg: string[]): void;

  abstract debug(...msg: string[]): void;

  abstract time(label: Label): void;

  abstract timeEnd(label: Label): void;
}
