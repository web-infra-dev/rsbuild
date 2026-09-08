import { expect, test } from '@e2e/helper';

test('should preserve native imports for Solid hydration assets without warnings', async ({
  runBoth,
}) => {
  await runBoth(({ result }) => {
    result.expectNoLog('Critical dependency');
    const content = Object.values(result.getDistFiles()).join('\n');
    expect(content).toContain('import(entryUrl)');
  });
});
