import { expect, describe, it } from 'vitest';
import { createRsbuild } from '../src';

describe('should use rspack as default bundler', () => {
  it('apply rspack correctly', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'development';
    const rsbuild = await createRsbuild({
      builderConfig: {},
    });

    expect(rsbuild.context.bundlerType).toBe('rspack');

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });
});
