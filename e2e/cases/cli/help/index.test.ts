import { stripVTControlCharacters as stripAnsi } from 'node:util';
import { expect, test } from '@e2e/helper';

test('should show the root help', ({ execCliSync }) => {
  const output = stripAnsi(execCliSync('-h'));

  expect(output).toContain('Usage:\n  $ rsbuild [command] [options]');
  expect(output).toContain('Commands:');
  expect(output).toContain('For details on a sub-command, run:');
});

test('should show the dev command help', ({ execCliSync }) => {
  for (const args of ['dev -h', '-h dev']) {
    const output = stripAnsi(execCliSync(args));

    expect(output).toContain('Usage:\n  $ rsbuild dev [options]');
    expect(output).not.toContain('Commands:');
    expect(output).not.toContain('For details on a sub-command, run:');
  }
});

test('should show the build command help', ({ execCliSync }) => {
  const output = stripAnsi(execCliSync('build -h'));

  expect(output).toContain('Usage:\n  $ rsbuild build [options]');
  expect(output).not.toContain('Commands:');
  expect(output).not.toContain('For details on a sub-command, run:');
});
