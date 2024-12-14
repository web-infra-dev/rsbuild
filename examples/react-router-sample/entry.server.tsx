import type { ServerResponse } from 'node:http';
/* cspell:words Pipeable */
import { StrictMode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import {
  type StaticHandlerContext,
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

export async function handleDocumentRequest(
  request: Request,
  assets?: Assets,
  options: RenderOptions = {},
) {
  // 1. Run action/loaders to get the routing context with `query`
  const context = await query(request);

  // If `query` returns a Response, send it raw (a route probably redirected)
  if (context instanceof Response) {
    return context;
  }

  // 2. Create a static router for SSR
  const router = createStaticRouter(dataRoutes, context);

  // Setup headers from action and loaders from deepest match
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

  // Get assets including route-specific ones
  const routeAssets = assets || { scriptTags: [], styleTags: [] };

  if (options.mode === 'streaming') {
    console.log('is streaming');
    return handleStreamingResponse(router, context, routeAssets, headers);
  }

  // Buffered mode - collect stream into string
  let appHtml = '';
  const { Writable } = require('node:stream');
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

async function handleStreamingResponse(
  router: ReturnType<typeof createStaticRouter>,
  context: StaticHandlerContext,
  assets: Assets,
  headers: Headers,
): Promise<StreamingResponse | ErrorResponse> {
  let didError = false;

  const htmlStart = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>React Router Custom Framework</title>
    ${assets.styleTags.map((tag) => `<link rel="stylesheet" href="${tag}" />`).join('\n    ') || ''}
  </head>
  <body>
    <div id="root">`;

  const htmlEnd = `</div>
    <script>
      window.__staticRouterHydrationData = ${JSON.stringify(context).replace(
        /</g,
        '\\u003c',
      )};
    </script>
    ${assets.scriptTags.map((tag) => `<script defer src="${tag}"></script>`).join('\n    ') || ''}
  </body>
</html>`;

  return new Promise((resolve) => {
    const { PassThrough } = require('node:stream');
    const responseStream = new PassThrough();

    const { pipe } = renderToPipeableStream(
      <StrictMode>
        <AssetsContext.Provider value={assets}>
          <StaticRouterProvider router={router} context={context} />
        </AssetsContext.Provider>
      </StrictMode>,
      {
        bootstrapScripts: assets.scriptTags,
        onShellReady() {
          responseStream.write(htmlStart);
          pipe(responseStream);
          resolve({
            status: didError ? 500 : context.statusCode,
            headers,
            pipe: (res: ServerResponse) => {
              responseStream.pipe(res);
            },
          });
        },
        onAllReady() {
          responseStream.write(htmlEnd);
          responseStream.end();
        },
        onShellError(error) {
          didError = true;
          console.error('Shell render error:', error);
          resolve({
            status: 500,
            headers: new Headers({
              'content-type': 'text/html; charset=utf-8',
            }),
            body: '<!doctype html><html><body><h1>Something went wrong</h1></body></html>',
          });
        },
        onError(error) {
          didError = true;
          console.error('Streaming render error:', error);
        },
      },
    );
  });
}

export async function handleDataRequest(request: Request) {
  // 1. we don't want to proxy the browser request directly to our router, so we
  // make a new one.
  const newRequest =
    request.method === 'POST'
      ? new Request(request.url, {
          method: request.method,
          headers: request.headers,
          // @ts-expect-error this is valid, types are wrong
          body: new URLSearchParams(await request.formData()),
        })
      : new Request(request.url, { headers: request.headers });

  // 2. get data from our router, queryRoute knows to call the action or loader
  // of the leaf route that matches
  const data = await queryRoute(newRequest);

  // 3. send the response
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
}
