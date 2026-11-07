import { expect, test } from '@e2e/helper';

test('should only apply React Compiler to included modules', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(async ({ mode, result }) => {
    for (const id of ['compiledcounter', 'excludedcounter', 'legacycounter']) {
      const button = page.locator(`#${id}`);
      await expect(button).toHaveText(/: 0$/);
      await button.click();
      await expect(button).toHaveText(/: 1$/);
    }

    if (mode === 'build') {
      const index = await result.getIndexBundle();
      const getComponent = (name: string) => {
        const start = index.indexOf(`const ${name} = ()=>{`);
        expect(start).toBeGreaterThan(-1);
        return index.slice(start, index.indexOf('\n};', start));
      };

      expect(getComponent('CompiledCounter')).toContain('compiler_runtime.c');
      expect(getComponent('ExcludedCounter')).not.toContain('compiler_runtime');
      expect(getComponent('LegacyCounter')).not.toContain('compiler_runtime');
    }
  });
});
