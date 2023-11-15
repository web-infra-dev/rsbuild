import path from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

test('should compile CSS modules composes correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  if (rsbuild.providerType === 'rspack') {
    expect(content).toMatch(
      /.*\{background:red;color:yellow\}.*\{background:blue\}/,
    );
  } else {
    expect(content).toMatch(
      /.*\{background:red;color:#ff0\}.*\{background:blue\}/,
    );
  }
});

test('should compile CSS modules composes with external correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      source: {
        entries: { external: path.resolve(__dirname, './src/external.js') },
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  if (rsbuild.providerType === 'rspack') {
    expect(content).toMatch(
      /.*\{background:cyan;color:black\}.*\{background:green\}/,
    );
  } else {
    expect(content).toMatch(
      /.*\{background:cyan;color:#000\}.*\{background:green\}/,
    );
  }
});
