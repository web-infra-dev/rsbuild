/* cspell:words Pipeable */
import { Writable } from 'node:stream';
import { StrictMode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import {
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
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
  const context = await query(request);

  if (context instanceof Response) {
    return context;
  }

  const router = createStaticRouter(dataRoutes, context);
  const deepestMatch = context.matches[context.matches.length - 1];
  const routeId = deepestMatch.route.id;

  // Get assets including route-specific ones
  const routeAssets = assets || { scriptTags: [], styleTags: [] };

  // Create headers object
  const responseHeaders = {
    'content-type': 'text/html; charset=utf-8',
  };

  const actionHeaders = context.actionHeaders[routeId];
  const loaderHeaders = context.loaderHeaders[routeId];

  if (actionHeaders) {
    for (const [key, value] of actionHeaders.entries()) {
      responseHeaders[key] = value;
    }
  }

  if (loaderHeaders) {
    for (const [key, value] of loaderHeaders.entries()) {
      responseHeaders[key] = value;
    }
  }

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
    let didError = false;
    return new Promise((resolve) => {
      const { PassThrough } = require('node:stream');
      const responseStream = new PassThrough();

      const stream = renderToPipeableStream(
        <StrictMode>
          <AssetsContext.Provider value={routeAssets}>
            <StaticRouterProvider router={router} context={context} />
          </AssetsContext.Provider>
        </StrictMode>,
        {
          bootstrapScripts: routeAssets.scriptTags,
          onShellReady() {
            // Write the HTML start
            responseStream.write(htmlStart);

            // Pipe the React rendered content
            stream.pipe(responseStream, { end: false });

            resolve({
              status: didError ? 500 : context.statusCode,
              headers: responseHeaders,
              body: responseStream,
            });
          },
          onCompleteAll() {
            // Write the ending HTML and close
            responseStream.write(
              `<script>window.__staticRouterHydrationData = ${JSON.stringify(
                context,
              ).replace(/</g, '\\u003c')};</script>${htmlEnd}`,
            );
            responseStream.end();
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
  } else {
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
      headers: responseHeaders,
      body: fullHtml,
    };
  }
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
