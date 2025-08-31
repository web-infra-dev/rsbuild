import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should compile optional chaining and nullish coalescing correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    catchBuildError: true,
  });

  expect(rsbuild.buildError).toBeFalsy();

  // Check that the build output contains transpiled code
  const outputs = await rsbuild.getDistFiles();
  const jsFiles = Object.keys(outputs).filter((file) => file.endsWith('.js'));
  expect(jsFiles.length).toBeGreaterThan(0);

  // Verify the transpiled code exists
  const mainJsFile =
    jsFiles.find((file) => file.includes('index')) || jsFiles[0];
  const jsContent = outputs[mainJsFile];
  expect(jsContent).toBeDefined();
  expect(jsContent.length).toBeGreaterThan(0);

  // Verify that optional chaining has been transpiled to conditional checks
  // The transpiled code should contain conditional patterns like "null==("
  expect(jsContent).toMatch(/null\s*==\s*\(/);

  // Verify that the code contains the expected variable assignments
  expect(jsContent).toContain('window.optionalChainingTest');
  expect(jsContent).toContain('window.nullishCoalescingTest');
  expect(jsContent).toContain('window.deepChainingTest');
  expect(jsContent).toContain('window.combinedTest');

  await rsbuild.close();
});
