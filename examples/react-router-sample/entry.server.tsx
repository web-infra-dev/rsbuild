// cspell:words Pipeable
import type { ServerResponse } from 'node:http';
import { PassThrough, Writable } from 'node:stream';
import { StrictMode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import type { StaticHandlerContext } from 'react-router-dom';
import {
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
} from 'react-router-dom';
import type { Assets } from './app/context.js';
import { AssetsContext } from './app/context.js';
import routes from './app/routes.js';

const { query, dataRoutes, queryRoute } = createStaticHandler(routes);

interface RenderOptions {
  mode?: 'buffered' | 'streaming';
}
interface StreamingResponse {
  status: number;
  headers: Headers;
  pipe: (res: ServerResponse) => void;
}

interface ErrorResponse {
  status: number;
  headers: Headers;
  body: string;
}

export async function handler(
  request: Request,
  assets?: Assets,
  options: RenderOptions = {},
) {
  if (request.headers.get('Accept')?.includes('application/json')) {
    return handleDataRequest(request);
  }
  return handleDocumentRequest(request, assets, options);
}

export async function handleDataRequest(request: Request) {
  const newRequest =
    request.method === 'POST'
      ? new Request(request.url, {
          method: request.method,
          headers: request.headers,
          // @ts-expect-error this is valid, types are wrong
          body: new URLSearchParams(await request.formData()),
        })
      : new Request(request.url, { headers: request.headers });

  const data = await queryRoute(newRequest);

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleDocumentRequest(
  request: Request,
  assets?: Assets,
  options: RenderOptions = {},
) {
  const context = await query(request);

  if (context instanceof Response) {
    return context;
  }

  const router = createStaticRouter(dataRoutes, context);
  const headers = getResponseHeaders(context);
  const routeAssets = assets || { scriptTags: [], styleTags: [] };

  return options.mode === 'streaming'
    ? handleStreamingResponse(router, context, routeAssets, headers)
    : handleBufferedResponse(router, context, routeAssets, headers);
}

function getResponseHeaders(context: StaticHandlerContext): Headers {
  const deepestMatch = context.matches[context.matches.length - 1];
  const actionHeaders = context.actionHeaders[deepestMatch.route.id];
  const loaderHeaders = context.loaderHeaders[deepestMatch.route.id];

  const headers = new Headers(actionHeaders);

  if (loaderHeaders) {
    loaderHeaders.forEach((value, key) => {
      headers.append(key, value);
    });
  }

  headers.set('Content-Type', 'text/html; charset=utf-8');
  return headers;
}

async function handleBufferedResponse(
  router: ReturnType<typeof createStaticRouter>,
  context: StaticHandlerContext,
  routeAssets: Assets,
  headers: Headers,
) {
  let appHtml = '';
  const stream = renderToPipeableStream(
    <StrictMode>
      <AssetsContext.Provider value={routeAssets}>
        <StaticRouterProvider router={router} context={context} />
      </AssetsContext.Provider>
    </StrictMode>,
  );

  await new Promise<void>((resolve) => {
    const writable = new Writable({
      write(
        chunk: Buffer,
        _encoding: BufferEncoding,
        callback: (error?: Error | null) => void,
      ) {
        appHtml += chunk;
        callback();
      },
      final(callback: (error?: Error | null) => void) {
        resolve();
        callback();
      },
    });
    stream.pipe(writable);
  });

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>React Router Custom Framework</title>
    ${routeAssets.styleTags.map((tag) => `<link rel="stylesheet" href="${tag}" />`).join('\n    ') || ''}
  </head>
  <body>
    <div id="root">${appHtml}</div>
    <script>
      window.__staticRouterHydrationData = ${JSON.stringify(context).replace(
        /</g,
        '\\u003c',
      )};
    </script>
    ${routeAssets.scriptTags.map((tag) => `<script defer src="${tag}"></script>`).join('\n    ') || ''}
  </body>
</html>`;

  return new Response(fullHtml, {
    status: context.statusCode,
    headers,
  });
}

async function handleStreamingResponse(
  router: ReturnType<typeof createStaticRouter>,
  context: StaticHandlerContext,
  assets: Assets,
  headers: Headers,
): Promise<StreamingResponse | ErrorResponse> {
  let didError = false;

  const { pipe } = renderToPipeableStream(
    <StrictMode>
      <AssetsContext.Provider value={assets}>
        <StaticRouterProvider router={router} context={context} />
      </AssetsContext.Provider>
    </StrictMode>,
    {
      bootstrapScripts: assets.scriptTags,
      onShellReady() {
        // Shell is ready to be written
      },
      onShellError(error) {
        didError = true;
        console.error('Shell render error:', error);
        return {
          status: 500,
          headers: new Headers({
            'content-type': 'text/html; charset=utf-8',
          }),
          body: '<!doctype html><html><body><h1>Something went wrong</h1></body></html>',
        };
      },
      onError(error) {
        didError = true;
        console.error('Streaming render error:', error);
      },
      onAllReady() {
        // All content ready, but we handle this in the writable stream's final callback
      },
    },
  );

  if (didError) {
    return {
      status: 500,
      headers: new Headers({
        'content-type': 'text/html; charset=utf-8',
      }),
      body: '<!doctype html><html><body><h1>Something went wrong</h1></body></html>',
    };
  }

  return {
    status: context.statusCode,
    headers,
    pipe: (res: ServerResponse) => {
      const writable = new Writable({
        write(chunk, _encoding, callback) {
          if (!res.writableEnded) {
            res.write(chunk, callback);
          } else {
            callback();
          }
        },
        final() {
          if (!res.writableEnded) {
            const hydrationScript = `
              <script>
                window.__staticRouterHydrationData = ${JSON.stringify(
                  context,
                ).replace(/</g, '\\u003c')};
              </script>
              ${assets.scriptTags.map((tag) => `<script defer src="${tag}"></script>`).join('\n')}
            `;
            res.write(hydrationScript);
            res.end('</body></html>');
          }
        },
      });

      res.write(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>React Router Custom Framework</title>
    ${assets.styleTags.map((tag) => `<link rel="stylesheet" href="${tag}" />`).join('\n    ')}
  </head>
  <body>
    <div id="root">`);

      pipe(writable);

      res.on('error', (error) => {
        console.error('Response stream error:', error);
        if (!res.writableEnded) {
          res.end();
        }
      });
    },
  };
}
