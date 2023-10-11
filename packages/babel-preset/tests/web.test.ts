import { getBabelPresetForWeb } from '../src/web';

test('should provide web preset as expected', () => {
  expect(
    getBabelPresetForWeb({
      presetEnv: {
        targets: ['Chrome >= 53'],
        useBuiltIns: false,
      },
    }),
  ).toMatchSnapshot();
});

test('should support inject core-js polyfills by entry', () => {
  expect(
    getBabelPresetForWeb({
      presetEnv: {
        targets: ['Chrome >= 53'],
        useBuiltIns: 'entry',
      },
    }),
  ).toMatchSnapshot();
});

test('should support inject core-js polyfills by usage', () => {
  expect(
    getBabelPresetForWeb({
      presetEnv: {
        targets: ['Chrome >= 53'],
        useBuiltIns: 'usage',
      },
    }),
  ).toMatchSnapshot();
});

test('should allow to enable legacy decorator', () => {
  expect(
    getBabelPresetForWeb({
      presetEnv: {
        targets: ['Chrome >= 53'],
        useBuiltIns: false,
      },
      pluginDecorators: {
        version: 'legacy',
      },
    }),
  ).toMatchSnapshot();
});

test('should allow to enable specific version decorator', () => {
  expect(
    getBabelPresetForWeb({
      presetEnv: {
        targets: ['Chrome >= 53'],
        useBuiltIns: false,
      },
      pluginDecorators: {
        version: '2018-09',
      },
    }),
  ).toMatchSnapshot();
});
