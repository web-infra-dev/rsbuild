import { expect, rspackTest } from '@e2e/helper';

rspackTest('should apply nonce to script and style tags', async ({ build }) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();
  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];
  expect(html).toContain(`<script defer nonce="CSP_NONCE_PLACEHOLDER">`);
  expect(html).toContain(`<style nonce="CSP_NONCE_PLACEHOLDER">body{`);
});

rspackTest('should apply environment nonce', async ({ build }) => {
  const rsbuild = await build({
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
  const files = rsbuild.getDistFiles();
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
