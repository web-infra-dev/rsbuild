import { pickRsbuildConfig } from '../src/createRsbuild';

describe('pickRsbuildConfig', () => {
  it('should pick correct keys from Rsbuild config', () => {
    const rsbuildConfig = {
      dev: {},
      html: {},
      tools: {},
      source: {},
      output: {},
      security: {},
      performance: {},
      extraKey: 'extraValue',
    };

    const result = pickRsbuildConfig(rsbuildConfig);

    expect(result).toEqual({
      dev: {},
      html: {},
      tools: {},
      source: {},
      output: {},
      security: {},
      performance: {},
    });
  });

  it('should return empty object when Rsbuild config is empty', () => {
    const rsbuildConfig = {};
    const result = pickRsbuildConfig(rsbuildConfig);
    expect(result).toEqual({});
  });
});
