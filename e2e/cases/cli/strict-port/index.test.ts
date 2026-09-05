import { stripVTControlCharacters as stripAnsi } from 'node:util';
import { expect, test } from '@e2e/helper';
import { occupyPort } from '@rstackjs/test-utils';

const HOST = '0.0.0.0';

test('should exit when port is occupied and --strict-port is used', async ({
  execCliSync,
}) => {
  const blocker = await occupyPort(HOST);

  let message = '';
  try {
    execCliSync(`dev --host ${HOST} --port ${blocker.port} --strict-port`, {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
  } catch (error) {
    if (error instanceof Error) {
      message = stripAnsi(error.message);
    }
  } finally {
    await blocker.close();
  }

  expect(message).toContain(`Port ${blocker.port} is occupied`);
});
