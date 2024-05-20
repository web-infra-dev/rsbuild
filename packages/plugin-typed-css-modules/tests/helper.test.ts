import { isCSSModules } from '../src/loader';

it('check isCSSModules', () => {
  expect(isCSSModules('src/index.css', false)).toBeFalsy();
  expect(isCSSModules('src/index.css', { auto: false })).toBeFalsy();
  expect(isCSSModules('src/index.module.css', { auto: false })).toBeFalsy();

  expect(isCSSModules('src/index.css', true)).toBeTruthy();

  expect(isCSSModules('src/index.css', { auto: true })).toBeFalsy();
  expect(isCSSModules('src/index.module.css', { auto: true })).toBeTruthy();

  expect(
    isCSSModules('src/index.module.css', {
      auto: (path) => {
        return path.includes('.module.');
      },
    }),
  ).toBeTruthy();

  expect(
    isCSSModules('src/index.css', {
      auto: (path) => {
        return path.includes('.module.');
      },
    }),
  ).toBeFalsy();

  expect(
    isCSSModules('src/index.module.css', {
      auto: /\.module\./i,
    }),
  ).toBeTruthy();

  expect(
    isCSSModules('src/index.css', {
      auto: /\.module\./i,
    }),
  ).toBeFalsy();
});
