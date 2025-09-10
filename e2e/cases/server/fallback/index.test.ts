import { dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should return 204 for OPTIONS requests when no middleware handles them', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
    rsbuildConfig: {},
  });

  const response = await fetch(`http://127.0.0.1:${rsbuild.port}`, {
    headers: {
      'content-type': 'application/json',
    },
    method: 'OPTIONS',
  });
  expect(response.status).toBe(204);

  await rsbuild.close();
});

test('should return 200 with custom headers for OPTIONS requests handled by middleware', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      server: {
        cors: false,
      },
      dev: {
        setupMiddlewares: (middlewares) => {
          middlewares.push((req, res, next) => {
            if (req.method === 'OPTIONS') {
              res.statusCode = 200;
              res.setHeader(
                'access-control-allow-origin',
                'https://example.com',
              );
              res.end();
              return;
            }
            next();
          });
        },
      },
    },
  });

  const response = await fetch(`http://127.0.0.1:${rsbuild.port}`, {
    headers: {
      'content-type': 'application/json',
    },
    method: 'OPTIONS',
  });
  expect(response.status).toBe(200);
  expect(response.headers.get('access-control-allow-origin')).toBe(
    'https://example.com',
  );

  await rsbuild.close();
});
