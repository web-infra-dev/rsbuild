import { stripVTControlCharacters as stripAnsi } from 'node:util';
import { expect, test } from '@e2e/helper';
import { occupyPort } from '@rstackjs/test-utils';

const HOST = '0.0.0.0';

test('should throw when strictPort is enabled and port is taken', async ({
  devOnly,
}) => {
  const blocker = await occupyPort(HOST);

  let message = '';
  try {
    await devOnly({
      config: {
        server: {
          host: HOST,
          port: blocker.port,
          strictPort: true,
        },
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      message = error.message;
    }
  } finally {
    await blocker.close();
  }

  expect(stripAnsi(message)).toContain(`Port ${blocker.port} is occupied`);
});
