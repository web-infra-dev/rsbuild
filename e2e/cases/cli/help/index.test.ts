import { stripVTControlCharacters as stripAnsi } from 'node:util';
import { expect, test } from '@e2e/helper';
import { normalizeEol } from '@rstackjs/test-utils';

const normalizeHelpOutput = (output: string) =>
  normalizeEol(stripAnsi(output))
    // Package versions and terminal whitespace are unrelated to the help contract.
    .replace(/^Rsbuild v.+$/m, 'Rsbuild v<version>')
    .replace(/[ \t]+$/gm, '')
    .trim();

test('should show the root help', ({ execCliSync }) => {
  expect(normalizeHelpOutput(execCliSync('-h'))).toMatchSnapshot();
});

test('should show the dev command help', ({ execCliSync }) => {
  const output = normalizeHelpOutput(execCliSync('dev -h'));

  expect(output).toMatchSnapshot();
  expect(normalizeHelpOutput(execCliSync('-h dev'))).toBe(output);
});

test('should show the build command help', ({ execCliSync }) => {
  expect(normalizeHelpOutput(execCliSync('build -h'))).toMatchSnapshot();
});

test('should show the preview command help', ({ execCliSync }) => {
  expect(normalizeHelpOutput(execCliSync('preview -h'))).toMatchSnapshot();
});

test('should show the inspect command help', ({ execCliSync }) => {
  expect(normalizeHelpOutput(execCliSync('inspect -h'))).toMatchSnapshot();
});
