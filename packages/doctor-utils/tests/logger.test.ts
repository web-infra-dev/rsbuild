import {
  afterAll,
  expect,
  describe,
  beforeEach,
  afterEach,
  test,
  vi,
} from 'vitest';
import { createLogger, Logger } from '../src/logger';

describe('logger', () => {
  const consoleLog = console.log;
  const mockLog = vi.fn((...args: string[]) => undefined);

  beforeEach(() => {
    console.log = mockLog;
  });
  afterEach(() => {
    mockLog.mockClear();
  });
  afterAll(() => {
    console.log = consoleLog;
  });

  test('default config', () => {
    expect(createLogger().opts.level).toEqual('Info');
    expect(createLogger().opts.timestamp).toEqual(false);
    expect(new Logger({}).opts.level).toEqual(undefined);
    expect(new Logger({}).opts.timestamp).toEqual(undefined);
  });

  test('intercept', () => {
    createLogger({ level: 'Silent' }).error('should not output');
    createLogger({ level: 'Error' }).warn('should not output');
    createLogger({ level: 'Warning' }).info('should not output');
    createLogger({ level: 'Info' }).debug('should not output');
    expect(mockLog).not.toHaveBeenCalled();
  });

  test('should output', () => {
    createLogger({ level: 'Debug' }).info('should output');
    createLogger({ level: 'Verbose' }).debug('should output');
    expect(mockLog).toBeCalledTimes(2);
  });

  test('use timestamp', () => {
    const spyTimeStamp = vi.spyOn(Date.prototype, 'toLocaleTimeString');
    createLogger({ timestamp: false }).info('should not output');
    createLogger({ timestamp: true }).info('should output');
    expect(spyTimeStamp).toBeCalledTimes(1);
    spyTimeStamp.mockRestore();
  });

  test('use time log', async () => {
    const logName = 'test';
    const logger = createLogger({ level: 'Debug' });
    logger.time(logName);

    await new Promise<string>((resolve) => {
      setTimeout(() => {
        // @ts-ignore
        expect(logger.times.size).toEqual(1);
        logger.timeEnd(logName);
        expect(logger.timesLog.size).toEqual(1);
        // Ensure the unit in time log is milliseconds.
        expect(logger.timesLog.get(logName)).toBeLessThan(400);
        // @ts-ignore
        expect(logger.times.size).toEqual(0);
        expect(mockLog).toBeCalledTimes(1);
        resolve('done');
      }, 300);
    });
  });

  test('use timeEnd directly', () => {
    expect(() => createLogger().timeEnd('test')).toThrow(
      `Time label 'test' not found for Logger.timeEnd()`,
    );
  });
});
