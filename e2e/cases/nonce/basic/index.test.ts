import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should apply nonce to script and style tags', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.unwrapOutputJSON();
  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];
  expect(html).toContain(`<script defer nonce="CSP_NONCE_PLACEHOLDER">`);
  expect(html).toContain(`<style nonce="CSP_NONCE_PLACEHOLDER">body{`);
});

rspackOnlyTest('should apply environment nonce', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      environments: {
        web: {
          security: {
            nonce: 'CSP_NONCE_PLACEHOLDER',
          },
          output: {
            distPath: {
              root: 'dist',
            },
          },
        },
        web1: {
          security: {
            nonce: 'CSP_NONCE_PLACEHOLDER1',
          },
          output: {
            distPath: {
              root: 'dist/dist1',
            },
          },
        },
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();
  const html =
    files[Object.keys(files).find((file) => file.endsWith('dist/index.html'))!];
  expect(html).toContain(`<script defer nonce="CSP_NONCE_PLACEHOLDER">`);
  expect(html).toContain(`<style nonce="CSP_NONCE_PLACEHOLDER">body{`);

  const html1 =
    files[
      Object.keys(files).find((file) => file.endsWith('dist1/index.html'))!
    ];
  expect(html1).toContain(`<script defer nonce="CSP_NONCE_PLACEHOLDER1">`);
  expect(html1).toContain(`<style nonce="CSP_NONCE_PLACEHOLDER1">body{`);
});
