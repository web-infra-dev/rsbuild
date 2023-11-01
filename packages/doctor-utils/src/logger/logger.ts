import chalk from 'chalk';
import { Logger as L } from '@rsbuild/doctor-types';

const NUM_OF_MILLISEC_IN_SEC = BigInt(1000000);

export class Logger implements L.LoggerInstance {
  constructor(public opts: L.LoggerOptions) {}

  private times: Map<string, bigint> = new Map();

  timesLog: Map<string, number> = new Map();

  protected output(level: L.LogLevelName, ...message: string[]) {
    if (getLogLevel(this.opts.level ?? 'Info') < getLogLevel(level)) {
      return;
    }

    const format = () => {
      if (this.opts.timestamp) {
        return [
          `${chalk.dim(new Date().toLocaleTimeString())} ${message.join(' ')}`,
        ];
      }
      return message;
    };
    console.log(...format());
  }

  info(...msg: string[]) {
    this.output(
      'Info',
      this.opts?.prefix ? chalk.bold.blue(this.opts?.prefix) : '',
      chalk.bold.blue('INFO'),
      ...msg,
    );
  }

  warn(...msg: string[]) {
    this.output(
      'Warning',
      this.opts?.prefix ? chalk.bold.yellow(this.opts?.prefix) : '',
      chalk.bold.yellow('WARN'),
      ...msg,
    );
  }

  error(...msg: string[]) {
    this.output(
      'Error',
      this.opts?.prefix ? chalk.bold.red(this.opts?.prefix) : '',
      chalk.bold.red('ERROR'),
      ...msg,
    );
  }

  debug(...info: string[]) {
    this.output(
      'Debug',
      this.opts?.prefix ? chalk.bold.magentaBright(this.opts?.prefix) : '',
      chalk.bold.magentaBright('DEBUG'),
      ...info,
    );
  }

  time(label: string) {
    this.times.set(label, process.hrtime.bigint());
  }

  timeEnd(label: string) {
    const time = process.hrtime.bigint();
    const start = this.times.get(label);
    if (!start) {
      throw new Error(`Time label '${label}' not found for Logger.timeEnd()`);
    }
    this.times.delete(label);
    const diff = time - start;
    const diffMs = Number(diff / NUM_OF_MILLISEC_IN_SEC);
    this.timesLog.set(label, diffMs);
    this.debug(`Time label ${label} took ${diffMs}ms`);
  }
}

export function createLogger(
  options: L.LoggerOptions = { level: 'Info', timestamp: false, prefix: '' },
) {
  return new Logger(options);
}

export function getLogLevel(logLevel: L.LogLevelName): number {
  return L.LogLevel[logLevel];
}
