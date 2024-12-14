/* cspell:words Pipeable */
import { StrictMode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import {
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
  type StaticHandlerContext,
} from 'react-router-dom';
import { type Assets, AssetsContext } from './app/context';
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

  // Get assets including route-specific ones
  const routeAssets = assets || { scriptTags: [], styleTags: [] };

  // Setup headers from action and loaders from deepest match
  const deepestMatch = context.matches[context.matches.length - 1];
  const actionHeaders = context.actionHeaders[deepestMatch.route.id];
  const loaderHeaders = context.loaderHeaders[deepestMatch.route.id];

  const headers = new Headers();
  if (actionHeaders) {
    actionHeaders.forEach((value, key) => {
      headers.append(key, value);
    });
  }
  if (loaderHeaders) {
    loaderHeaders.forEach((value, key) => {
      headers.append(key, value);
    });
  }
  headers.set('content-type', 'text/html; charset=utf-8');

  // Create the HTML shell
  const htmlStart = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>React Router Custom Framework</title>
    ${routeAssets.styleTags.map((tag) => `<link rel="stylesheet" href="${tag}" />`).join('\n    ') || ''}
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
    ${routeAssets.scriptTags.map((tag) => `<script defer src="${tag}"></script>`).join('\n    ') || ''}
  </body>
</html>`;

  if (options.mode === 'streaming') {
    return handleStreamingResponse(router, context, routeAssets, htmlStart, htmlEnd, headers);
  }

  // Buffered mode
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
      write(chunk, _encoding, callback) {
        appHtml += chunk;
        callback();
      },
      final(callback) {
        resolve();
        callback();
      },
    });
    stream.pipe(writable);
  });

  const fullHtml = htmlStart + appHtml + htmlEnd;

  return {
    status: context.statusCode,
    headers,
    body: fullHtml,
  };
}

async function handleStreamingResponse(
  router: ReturnType<typeof createStaticRouter>,
  context: StaticHandlerContext,
  assets: Assets,
  htmlStart: string,
  htmlEnd: string,
  headers: Headers,
) {
  let didError = false;
  
  return new Promise((resolve) => {
    const { PassThrough } = require('node:stream');
    const responseStream = new PassThrough();

    const stream = renderToPipeableStream(
      <StrictMode>
        <AssetsContext.Provider value={assets}>
          <StaticRouterProvider router={router} context={context} />
        </AssetsContext.Provider>
      </StrictMode>,
      {
        bootstrapScripts: assets.scriptTags,
        onShellReady() {
          responseStream.write(htmlStart);
          stream.pipe(responseStream, { end: false });
          resolve({
            status: didError ? 500 : context.statusCode,
            headers,
            body: responseStream,
          });
        },
        onCompleteAll() {
          responseStream.end(htmlEnd);
        },
        onError(error) {
          didError = true;
          console.error('Streaming render error:', error);
          const { Readable } = require('node:stream');
          resolve({
            status: 500,
            headers: { 'content-type': 'text/html; charset=utf-8' },
            body: Readable.from(
              `<!doctype html><p>Fatal Error: ${error instanceof Error ? error.message : 'Unknown Error'}</p>`,
            ),
          });
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
