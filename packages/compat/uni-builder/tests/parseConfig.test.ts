import { parseCommonConfig } from '../src/shared/parseCommonConfig';

describe('parseCommonConfig', () => {
  test('output.cssModuleLocalIdentName', () => {
    expect(
      parseCommonConfig({
        output: {
          cssModuleLocalIdentName: '[local]-[hash:base64:6]',
        },
      }).rsbuildConfig,
    ).toEqual({
      output: {
        cssModules: {
          localIdentName: '[local]-[hash:base64:6]',
        },
      },
    });
  });
});
