import { expect, describe, it } from 'vitest';
import { createBuilder } from '../src';

describe('should use rspack as default bundler', () => {
  it('apply rspack correctly', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'development';
    const builder = await createBuilder({
      builderConfig: {},
    });

    expect(builder.context.bundlerType).toBe('rspack');

    const bundlerConfigs = await builder.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });
});
