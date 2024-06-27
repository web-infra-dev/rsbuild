import { type CssLoaderModules, isCSSModules } from '../src/loader';

it('check isCSSModules', () => {
  const testIsCSSModules = (
    resourcePath: string,
    modules: CssLoaderModules,
  ) => {
    return isCSSModules({
      modules,
      resourcePath,
      resourceQuery: '',
      resourceFragment: '',
    });
  };

  expect(testIsCSSModules('/path/to/src/index.css', false)).toBeFalsy();
  expect(
    testIsCSSModules('/path/to/src/index.css', {
      auto: false,
      namedExport: false,
    }),
  ).toBeFalsy();
  expect(
    testIsCSSModules('/path/to/src/index.module.css', {
      auto: false,
      namedExport: false,
    }),
  ).toBeFalsy();

  expect(testIsCSSModules('/path/to/src/index.css', true)).toBeTruthy();

  expect(
    testIsCSSModules('/path/to/src/index.css', {
      auto: true,
      namedExport: false,
    }),
  ).toBeFalsy();
  expect(
    testIsCSSModules('/path/to/src/index.module.css', {
      auto: true,
      namedExport: false,
    }),
  ).toBeTruthy();

  expect(
    testIsCSSModules('/path/to/src/index.module.css', {
      auto: (path) => {
        return path.includes('.module.');
      },
      namedExport: false,
    }),
  ).toBeTruthy();

  expect(
    testIsCSSModules('/path/to/src/index.css', {
      auto: (path) => {
        return path.includes('.module.');
      },
      namedExport: false,
    }),
  ).toBeFalsy();

  expect(
    testIsCSSModules('/path/to/src/index.module.css', {
      auto: /\.module\./i,
      namedExport: false,
    }),
  ).toBeTruthy();

  expect(
    testIsCSSModules('/path/to/src/index.css', {
      auto: /\.module\./i,
      namedExport: false,
    }),
  ).toBeFalsy();
});
