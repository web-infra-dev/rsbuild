import { build, expect, rspackOnlyTest, test } from '@e2e/helper';
import { defaultAllowedOrigins } from '@rsbuild/core';

test('should expose `defaultAllowedOrigins`', async () => {
  expect(defaultAllowedOrigins).toBeInstanceOf(RegExp);
});

test('should include CORS headers for dev server if `cors` is `true`', async ({
  request,
  dev,
}) => {
  const rsbuild = await dev({
    rsbuildConfig: {
      server: {
        cors: true,
      },
    },
  });

  const response = await request.get(`http://127.0.0.1:${rsbuild.port}`);
  expect(response.headers()['access-control-allow-origin']).toEqual('*');
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
  async ({ request, dev }) => {
    const rsbuild = await dev({
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
  },
);

test('should not include CORS headers for dev server if `cors` is `false`', async ({
  request,
  dev,
}) => {
  const rsbuild = await dev({
    rsbuildConfig: {
      server: {
        cors: false,
      },
    },
  });

  const response = await request.get(`http://127.0.0.1:${rsbuild.port}`);
  expect(response.headers()).not.toHaveProperty('access-control-allow-origin');
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

test('should override `server.cors` for dev server when `server.headers` is set', async ({
  request,
  dev,
}) => {
  const rsbuild = await dev({
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
});

test('should override `server.cors` for preview server when `server.headers` is set', async ({
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
