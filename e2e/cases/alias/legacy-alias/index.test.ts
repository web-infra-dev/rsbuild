import { build, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to use the legacy `source.alias` config', async () => {
  const { logs, restore } = proxyConsole();
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.getDistFiles();
  const fileNames = Object.keys(files);
  const webIndex = fileNames.find(
    (file) => file.includes('static/js') && file.endsWith('index.js'),
  );
  const nodeIndex = fileNames.find(
    (file) => file.includes('server/index') && file.endsWith('index.js'),
  );

  expect(files[webIndex!]).toContain('for web target');
  expect(files[nodeIndex!]).toContain('for node target');

  expect(
    logs.some((log) => log.includes('"source.alias" config is deprecated')),
  ).toBeTruthy();
  restore();
});
