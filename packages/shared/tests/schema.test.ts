import { validateRsbuildConfig, sharedHtmlConfigSchema } from '../src/schema';

describe('validateRsbuildConfig', () => {
  it('test custom error', async () => {
    await expect(
      validateRsbuildConfig(sharedHtmlConfigSchema, {
        scriptLoading: 'foo',
      }),
    ).rejects
      .toThrowErrorMatchingInlineSnapshot(`"Rsbuild config validation error:
* Invalid enum value. Expected 'defer' | 'module' | 'blocking', received 'foo' at "scriptLoading""`);
  });

  it('test validate passed', async () => {
    await expect(
      validateRsbuildConfig(sharedHtmlConfigSchema, {
        scriptLoading: 'blocking',
      }),
    ).resolves.toBeDefined();
  });
});
