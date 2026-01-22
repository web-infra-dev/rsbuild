import { expect, test } from '@e2e/helper';

test('should exit with error code 1 when unknown options are provided', async ({
  execCliSync,
}) => {
  let error: any;
  try {
    execCliSync('build --unknown-option', {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    // If we reach here, the command succeeded when it should have failed
    throw new Error('Expected execCliSync to throw an error');
  } catch (err: any) {
    error = err;
  }

  // Verify that an error was thrown and check its properties
  expect(error).toBeDefined();
  expect(error.status).toBe(1);
  expect(error.stderr.toString()).toContain('Unknown option `--unknownOption`');
});
