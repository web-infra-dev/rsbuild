import { stripVTControlCharacters as stripAnsi } from 'node:util';
import { expect, rspackTest, runCliSync } from '@e2e/helper';

rspackTest('should run build command with log level: info', async () => {
  const result = stripAnsi(
    runCliSync('build --logLevel info', {
      cwd: __dirname,
    }).toString(),
  );

  expect(result).toContain('Rsbuild v');
  expect(result).toContain('build started...');
  expect(result).toContain('built in');
});

rspackTest('should run build command with log level: warn', async () => {
  const result = stripAnsi(
    runCliSync('build --logLevel warn', {
      cwd: __dirname,
    }).toString(),
  );

  expect(result).not.toContain('Rsbuild v');
  expect(result).not.toContain('build started...');
  expect(result).not.toContain('built in');
});
