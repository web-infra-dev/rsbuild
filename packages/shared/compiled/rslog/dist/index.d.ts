type ColorFn = (input: string | number | null | undefined) => string;

declare let LOG_TYPES: {
    error: {
        label: string;
        level: "error";
        color: ColorFn;
    };
    warn: {
        label: string;
        level: "warn";
        color: ColorFn;
    };
    info: {
        label: string;
        level: "info";
        color: ColorFn;
    };
    start: {
        label: string;
        level: "info";
        color: ColorFn;
    };
    ready: {
        label: string;
        level: "info";
        color: ColorFn;
    };
    success: {
        label: string;
        level: "info";
        color: ColorFn;
    };
    log: {
        level: "log";
    };
    debug: {
        label: string;
        level: "verbose";
        color: ColorFn;
    };
};

type LogLevel = 'error' | 'warn' | 'info' | 'log' | 'verbose';
type LogMessage = unknown;
interface LogType {
    label?: string;
    level: LogLevel;
    color?: ColorFn;
}
type LogFunction = (message?: LogMessage, ...args: any[]) => void;
interface Options {
    level?: LogLevel;
}
type LogMethods = keyof typeof LOG_TYPES;
type Logger = Record<LogMethods, LogFunction> & {
    greet: (message: string) => void;
    level: LogLevel;
    override: (customLogger: Partial<Record<LogMethods, LogFunction>>) => void;
};

declare let createLogger: (options?: Options) => Logger;

declare let logger: Logger;

export { type LogFunction, type LogLevel, type LogMessage, type LogType, type Logger, type Options, createLogger, logger };
