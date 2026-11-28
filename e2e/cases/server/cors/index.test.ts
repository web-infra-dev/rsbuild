import { expect, test } from '@e2e/helper';
import { defaultAllowedOrigins } from '@rsbuild/core';

test('should expose `defaultAllowedOrigins`', () => {
  expect(defaultAllowedOrigins).toBeInstanceOf(RegExp);
});

test('should include CORS headers for dev server if `cors` is `true`', async ({
  request,
  dev,
}) => {
  const rsbuild = await dev({
    config: {
      server: {
        cors: true,
      },
    },
  });

  const response = await request.get(`http://localhost:${rsbuild.port}`);
  expect(response.headers()['access-control-allow-origin']).toEqual('*');
});

test('should include CORS headers for preview server if `cors` is `true`', async ({
  request,
  buildPreview,
}) => {
  const rsbuild = await buildPreview({
    config: {
      server: {
        cors: true,
      },
    },
  });

  const response = await request.get(`http://localhost:${rsbuild.port}`);
  expect(response.headers()['access-control-allow-origin']).toEqual('*');
});

test('should include CORS headers for MF', async ({ request, dev }) => {
  const rsbuild = await dev({
    config: {
      moduleFederation: {
        options: {
          name: 'foo',
          exposes: {},
        },
      },
    },
  });

  const response = await request.get(`http://localhost:${rsbuild.port}`);
  expect(response.headers()['access-control-allow-origin']).toEqual('*');
});

test('should not include CORS headers for dev server if `cors` is `false`', async ({
  request,
  dev,
}) => {
  const rsbuild = await dev({
    config: {
      server: {
        cors: false,
      },
    },
  });

  const response = await request.get(`http://localhost:${rsbuild.port}`);
  expect(response.headers()).not.toHaveProperty('access-control-allow-origin');
});

test('should set `cors` to `false` by default', async ({
  request,
  buildPreview,
}) => {
  const rsbuild = await buildPreview();
  const response = await request.get(`http://localhost:${rsbuild.port}`);
  expect(response.headers()).not.toHaveProperty('access-control-allow-origin');
});

test('should not include CORS headers for preview server if `cors` is `false`', async ({
  request,
  buildPreview,
}) => {
  const rsbuild = await buildPreview({
    config: {
      server: {
        cors: false,
      },
    },
  });

  const response = await request.get(`http://localhost:${rsbuild.port}`);
  expect(response.headers()).not.toHaveProperty('access-control-allow-origin');
});

test('should allow to configure CORS', async ({ request, buildPreview }) => {
  const rsbuild = await buildPreview({
    config: {
      server: {
        cors: {
          origin: 'https://example.com',
        },
      },
    },
  });

  const response = await request.get(`http://localhost:${rsbuild.port}`);
  expect(response.headers()['access-control-allow-origin']).toEqual(
    'https://example.com',
  );
});

test('should support custom function for `server.cors.origin`', async ({
  request,
  dev,
}) => {
  const rsbuild = await dev({
    config: {
      server: {
        cors: {
          origin(origin, callback) {
            callback(null, origin === 'https://example.com');
          },
        },
      },
    },
  });

  const allowedRes = await request.get(`http://localhost:${rsbuild.port}`, {
    headers: {
      origin: 'https://example.com',
    },
  });
  expect(allowedRes.headers()['access-control-allow-origin']).toEqual(
    'https://example.com',
  );

  const deniedRes = await request.get(`http://localhost:${rsbuild.port}`, {
    headers: {
      origin: 'https://disallowed.example',
    },
  });
  expect(deniedRes.headers()).not.toHaveProperty('access-control-allow-origin');
});

test('should replace default origins when `server.cors.origin` is an array', async ({
  request,
  dev,
}) => {
  const rsbuild = await dev({
    config: {
      server: {
        cors: {
          origin: ['https://example.com'],
        },
      },
    },
  });

  const allowedRes = await request.get(`http://localhost:${rsbuild.port}`, {
    headers: {
      origin: 'https://example.com',
    },
  });
  expect(allowedRes.headers()['access-control-allow-origin']).toEqual(
    'https://example.com',
  );

  const localhostRes = await request.get(`http://localhost:${rsbuild.port}`, {
    headers: {
      origin: 'http://localhost:3000',
    },
  });
  expect(localhostRes.headers()).not.toHaveProperty(
    'access-control-allow-origin',
  );
});

test('should override `server.cors` for dev server when `server.headers` is set', async ({
  request,
  dev,
}) => {
  const rsbuild = await dev({
    config: {
      server: {
        cors: true,
        headers: {
          'Access-Control-Allow-Origin': 'https://example.com',
        },
      },
    },
  });

  const response = await request.get(`http://localhost:${rsbuild.port}`);
  expect(response.headers()['access-control-allow-origin']).toEqual(
    'https://example.com',
  );
});

test('should override `server.cors` for preview server when `server.headers` is set', async ({
  request,
  buildPreview,
}) => {
  const rsbuild = await buildPreview({
    config: {
      server: {
        cors: true,
        headers: {
          'Access-Control-Allow-Origin': 'https://example.com',
        },
      },
    },
  });

  const response = await request.get(`http://localhost:${rsbuild.port}`);
  expect(response.headers()['access-control-allow-origin']).toEqual(
    'https://example.com',
  );
});
