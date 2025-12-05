import type { LogLevel } from '../types';

export interface Logger {
  level: LogLevel;
  info: (...messages: unknown[]) => void;
  warn: (...messages: unknown[]) => void;
  error: (...messages: unknown[]) => void;
}

const LOG_METHODS = ['info', 'warn', 'error'] as const;
const LOG_LEVEL = {
  info: 0,
  warn: 1,
  error: 2,
  silent: 3,
} as const satisfies Record<LogLevel, number>;

type LoggerOptions = {
  prefix?: string;
  level?: LogLevel;
};
type LogMethod = (typeof LOG_METHODS)[number];

export const createLogger = (options: LoggerOptions = {}): Logger => {
  const { prefix, level = 'info' } = options;
  let currentLevel: LogLevel = level;

  const formatMessage = (message: unknown): unknown => {
    if (typeof message === 'string' && prefix) {
      return `${prefix} ${message}`;
    }

    return message;
  };

  const applyPrefix = (messages: unknown[]): unknown[] => {
    if (messages.length > 0) {
      const [head, ...tail] = messages;
      return [formatMessage(head), ...tail];
    }

    return messages;
  };

  const log = (method: LogMethod, ...messages: unknown[]): void => {
    if (LOG_LEVEL[method] < LOG_LEVEL[currentLevel]) return;
    console[method](...applyPrefix(messages));
  };

  const logger = {} as Logger;

  LOG_METHODS.forEach((method) => {
    logger[method] = (...messages: unknown[]) => log(method, ...messages);
  });

  Object.defineProperty(logger, 'level', {
    get: () => currentLevel,
    set: (level: LogLevel) => {
      currentLevel = level;
    },
  });

  return logger;
};

export const logger: Logger = createLogger({ prefix: '[rsbuild]' });
