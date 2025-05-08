import fs from 'node:fs';
import { join } from 'node:path';
import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to use tools.htmlPlugin to modify HTML plugin options', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      tools: {
        htmlPlugin(config, { entryName }) {
          if (entryName === 'index') {
            config.scriptLoading = 'module';
          }
        },
      },
    },
  });

  const htmlPath = join(rsbuild.distPath, 'index.html');
  const content = await fs.promises.readFile(htmlPath, 'utf-8');

  const allScripts = /(<script [\s\S]*?>)/g.exec(content);

  expect(
    allScripts?.every((data) => data.includes('type="module"')),
  ).toBeTruthy();
});

test('should allow to use tools.htmlPlugin to return a new config object', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      html: {
        crossorigin: true,
        tags: [
          {
            tag: 'div',
            children: 'extra div',
          },
        ],
      },
      tools: {
        htmlPlugin() {
          return {
            title: 'Hello',
          };
        },
      },
    },
  });

  const htmlPath = join(rsbuild.distPath, 'index.html');
  const content = await fs.promises.readFile(htmlPath, 'utf-8');

  expect(content).toContain('<title>Hello</title>');
  expect(content).toContain('crossorigin="anonymous"');
  expect(content).toContain('<div>extra div</div>');
});
