import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should include CORS headers for dev server if `cors` is `true`', async ({
  page,
  request,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      server: {
        cors: true,
      },
    },
  });

  const response = await request.get(`http://127.0.0.1:${rsbuild.port}`);
  expect(response.headers()['access-control-allow-origin']).toEqual('*');

  await rsbuild.close();
});

test('should include CORS headers for preview server if `cors` is `true`', async ({
  page,
  request,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      server: {
        cors: true,
      },
    },
  });

  const response = await request.get(`http://127.0.0.1:${rsbuild.port}`);
  expect(response.headers()['access-control-allow-origin']).toEqual('*');

  await rsbuild.close();
});

test('should not include CORS headers for dev server if `cors` is `false`', async ({
  page,
  request,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      server: {
        cors: false,
      },
    },
  });

  const response = await request.get(`http://127.0.0.1:${rsbuild.port}`);
  expect(response.headers()).not.toHaveProperty('access-control-allow-origin');
  await rsbuild.close();
});

test('should not include CORS headers for preview server if `cors` is `false`', async ({
  page,
  request,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      server: {
        cors: false,
      },
    },
  });

  const response = await request.get(`http://127.0.0.1:${rsbuild.port}`);
  expect(response.headers()).not.toHaveProperty('access-control-allow-origin');
  await rsbuild.close();
});

test('should allow to configure CORS', async ({ page, request }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      server: {
        cors: {
          origin: 'https://example.com',
        },
      },
    },
  });

  const response = await request.get(`http://127.0.0.1:${rsbuild.port}`);
  expect(response.headers()['access-control-allow-origin']).toEqual(
    'https://example.com',
  );

  await rsbuild.close();
});
