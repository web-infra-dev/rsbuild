import { isCssModules } from '../src/css';

it('check isCssModules', () => {
  expect(isCssModules('src/index.css', false)).toBeFalsy();
  expect(isCssModules('src/index.css', { auto: false })).toBeFalsy();
  expect(isCssModules('src/index.module.css', { auto: false })).toBeFalsy();

  expect(isCssModules('src/index.css', true)).toBeTruthy();

  expect(isCssModules('src/index.css', { auto: true })).toBeFalsy();
  expect(isCssModules('src/index.module.css', { auto: true })).toBeTruthy();

  expect(
    isCssModules('src/index.module.css', {
      auto: (path) => {
        return path.includes('.module.');
      },
    }),
  ).toBeTruthy();

  expect(
    isCssModules('src/index.css', {
      auto: (path) => {
        return path.includes('.module.');
      },
    }),
  ).toBeFalsy();

  expect(
    isCssModules('src/index.module.css', {
      auto: /\.module\./i,
    }),
  ).toBeTruthy();

  expect(
    isCssModules('src/index.css', {
      auto: /\.module\./i,
    }),
  ).toBeFalsy();
});
