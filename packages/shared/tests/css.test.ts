import {
  isCssModules,
  applyAutoprefixer,
  normalizeCssLoaderOptions,
} from '../src/css';
import autoprefixer from '../compiled/autoprefixer';
import type { NormalizedConfig } from '../src';

describe('normalizeCssLoaderOptions', () => {
  it('should enable exportOnlyLocals correctly', () => {
    expect(normalizeCssLoaderOptions({ modules: false }, true)).toEqual({
      modules: false,
    });

    expect(normalizeCssLoaderOptions({ modules: true }, true)).toEqual({
      modules: {
        exportOnlyLocals: true,
      },
    });

    expect(normalizeCssLoaderOptions({ modules: true }, false)).toEqual({
      modules: true,
    });

    expect(normalizeCssLoaderOptions({ modules: 'local' }, true)).toEqual({
      modules: {
        mode: 'local',
        exportOnlyLocals: true,
      },
    });

    expect(
      normalizeCssLoaderOptions({ modules: { auto: true } }, true),
    ).toEqual({
      modules: {
        auto: true,
        exportOnlyLocals: true,
      },
    });
  });
});

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

it('should not apply autoprefixer if user config contains autoprefixer', async () => {
  const config = {
    tools: {},
  } as NormalizedConfig;

  expect(
    (await applyAutoprefixer([autoprefixer()], ['Chrome >= 100'], config))
      .length,
  ).toEqual(1);

  expect(
    (await applyAutoprefixer([autoprefixer], ['Chrome >= 100'], config)).length,
  ).toEqual(1);

  expect(
    (await applyAutoprefixer([], ['Chrome >= 100'], config)).length,
  ).toEqual(1);
});
