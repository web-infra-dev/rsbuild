import net from 'net';
import { color } from './color';
import { logger } from './logger';

/**
 * Get available free port.
 * @param port - Current port want to use.
 * @param tryLimits - Maximum number of retries.
 * @param strictPort - Whether to throw an error when the port is occupied.
 * @returns Available port number.
 */
export const getPort = async (
  port: string | number,
  strictPort: boolean = false,
  {
    tryLimits = 20,
    silent = false,
  }: {
    tryLimits?: number;
    silent?: boolean;
  } = {},
): Promise<number> => {
  if (typeof port === 'string') {
    port = parseInt(port, 10);
  }

  if (strictPort) {
    tryLimits = 1;
  }

  const original = port;

  let found = false;
  let attempts = 0;
  while (!found && attempts <= tryLimits) {
    try {
      await new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on('error', reject);
        server.listen(
          {
            port,
            host: '0.0.0.0',
          },
          () => {
            found = true;
            server.close(resolve);
          },
        );
      });
    } catch (e: any) {
      if (e.code !== 'EADDRINUSE') {
        throw e;
      }
      port++;
      attempts++;
    }
  }

  if (port !== original) {
    if (strictPort) {
      throw new Error(
        `Port "${original}" is occupied, please choose another one.`,
      );
    } else if (!silent) {
      logger.info(
        `Port ${original} is in use, ${color.yellow(`using port ${port}.`)}\n`,
      );
    }
  }

  return port;
};
/* eslint-enable no-param-reassign, @typescript-eslint/no-loop-func */
