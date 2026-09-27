import { isCI } from '../src/helpers/isCI';

it.each<[string | undefined, boolean]>([
  [undefined, false],
  ['', false],
  ['false', false],
  ['true', true],
  ['1', true],
  ['0', true],
])('should detect CI=%s as %s', (value, expected) => {
  rstest.stubEnv('CI', value);
  expect(isCI()).toBe(expected);
});
