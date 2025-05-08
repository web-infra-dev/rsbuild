import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { defaultAllowedOrigins } from '@rsbuild/core';

test('should expose `defaultAllowedOrigins`', async () => {
  expect(defaultAllowedOrigins).toBeInstanceOf(RegExp);
});

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

rspackOnlyTest(
  'should include CORS headers for MF',
  async ({ page, request }) => {
    const rsbuild = await dev({
      cwd: __dirname,
      page,
      rsbuildConfig: {
        moduleFederation: {
          options: {
            name: 'foo',
            exposes: {},
          },
        },
      },
    });

    const response = await request.get(`http://127.0.0.1:${rsbuild.port}`);
    expect(response.headers()['access-control-allow-origin']).toEqual('*');

    await rsbuild.close();
  },
);

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

test('should set `cors` to `false` by default', async ({ page, request }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
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

test('`server.headers` should override `server.cors` for dev server', async ({
  page,
  request,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      server: {
        cors: true,
        headers: {
          'Access-Control-Allow-Origin': 'https://example.com',
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

test('`server.headers` should override `server.cors` for preview server', async ({
  page,
  request,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      server: {
        cors: true,
        headers: {
          'Access-Control-Allow-Origin': 'https://example.com',
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
