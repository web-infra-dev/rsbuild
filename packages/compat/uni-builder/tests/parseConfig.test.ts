import { parseCommonConfig } from '../src/shared/parseCommonConfig';

describe('parseCommonConfig', () => {
  test('output.cssModuleLocalIdentName', () => {
    expect(
      parseCommonConfig({
        output: {
          cssModuleLocalIdentName: '[local]-[hash:base64:6]',
        },
      }).rsbuildConfig,
    ).toMatchSnapshot();
  });

  test('html.metaByEntries', () => {
    expect(
      parseCommonConfig({
        html: {
          metaByEntries: {
            foo: {
              viewport: 'bar',
            },
          },
        },
      }).rsbuildConfig,
    ).toMatchSnapshot();

    expect(
      parseCommonConfig({
        html: {
          meta: {
            charset: {
              charset: 'UTF-8',
            },
          },
          metaByEntries: {
            foo: {
              viewport: 'bar',
            },
          },
        },
      }).rsbuildConfig,
    ).toMatchSnapshot();
  });

  test('html.titleByEntries', () => {
    expect(
      parseCommonConfig({
        html: {
          titleByEntries: {
            foo: 'Foo',
          },
        },
      }).rsbuildConfig,
    ).toMatchSnapshot();

    expect(
      parseCommonConfig({
        html: {
          title: 'Default',
          titleByEntries: {
            foo: 'Foo',
          },
        },
      }).rsbuildConfig,
    ).toMatchSnapshot();
  });
});
