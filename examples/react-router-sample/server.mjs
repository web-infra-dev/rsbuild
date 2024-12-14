import fs from 'node:fs/promises';
import path from 'node:path';
import { createRsbuild, loadConfig } from '@rsbuild/core';
import express from 'express';

const PORT = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 4000;
const FORCE_STREAMING = (process.env.FORCE_STREAMING || 'true') === 'true';

async function getManifestAssets(routeId) {
  try {
    const manifestPath = path.join(process.cwd(), 'dist/manifest.json');
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);
    const { js = [], css = [] } = manifest.entries.client.initial;

    let routeAssets = { js: [], css: [] };
    if (routeId && manifest.namedChunks[routeId]) {
      const { js: routeJs = [], css: routeCss = [] } =
        manifest.namedChunks[routeId];
      routeAssets = { js: routeJs, css: routeCss };
    }

    return {
      scriptTags: [...js, ...routeAssets.js],
      styleTags: [...css, ...routeAssets.css],
    };
  } catch (error) {
    console.error('Error reading manifest:', error);
    return { scriptTags: [], styleTags: [] };
  }
}

async function createSSRHandler(rsbuildServer, isProduction = false) {
  return async (req, res, next) => {
    try {
      if (!req.headers.host) {
        throw new Error('No host header present');
      }

      const serverModule = await (isProduction
        ? rsbuildServer.loadBundle('server')
        : rsbuildServer.environments?.node.loadBundle('server'));

      const url = new URL(req.url, `http://${req.headers.host}`);
      const routeId = url.pathname.split('/').pop() || 'home';
      const assets = await getManifestAssets(routeId);

      const request = new Request(url, {
        method: req.method,
        headers: req.headers,
        ...(req.method !== 'GET' && { body: req.body }),
      });

      // Use streaming if client accepts it or if forced
      const streamingPreferred =
        FORCE_STREAMING || req.headers.accept?.includes('text/html-streaming');
      const response = await serverModule.handler(request, assets, {
        mode: streamingPreferred ? 'streaming' : 'buffered',
      });

      res.status(response.status);

      // Set headers from plain object
      Object.entries(response.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      if (response.body && streamingPreferred) {
        // Handle streaming response
        response.body.pipe(res);

        // Handle any stream errors
        response.body.on('error', (err) => {
          console.error('Streaming error:', err);
          if (!res.headersSent) {
            res.status(500).send('Streaming error occurred');
          } else {
            res.end();
          }
        });
      } else {
        // Handle buffered response
        res.send(response.body);
      }
    } catch (err) {
      console.error('SSR render error:', err);
      next(err);
    }
  };
}

async function startServer(isProduction = false) {
  const app = express();
  let rsbuildServer;

  try {
    const { content } = await loadConfig({});
    if (!content) {
      throw new Error('Failed to load Rsbuild config');
    }

    const rsbuild = await createRsbuild({
      rsbuildConfig: content,
    });

    rsbuildServer = isProduction
      ? rsbuild
      : await rsbuild.createDevServer({
          streamingPreferred: FORCE_STREAMING,
        });

    // Parse JSON bodies
    app.use(express.json());

    if (!isProduction) {
      // Use Rsbuild dev middleware for static assets in dev
      app.use(rsbuildServer.middlewares);
    } else {
      // Serve static assets with cache headers in prod
      app.use(
        express.static(path.join(process.cwd(), 'dist/web'), {
          maxAge: '1y',
          etag: true,
          immutable: true,
        }),
      );
    }

    // Handle SSR requests
    app.all('*', await createSSRHandler(rsbuildServer, isProduction));

    const server = app.listen(PORT, async () => {
      console.log(`Server started at http://localhost:${PORT}`);
      if (!isProduction) {
        await rsbuildServer.afterListen();
      }
    });

    if (!isProduction) {
      rsbuildServer.connectWebSocket({ server });
    }

    // Handle uncaught errors
    process.on('uncaughtException', (err) => {
      console.error('Uncaught exception:', err);
      server.close(() => process.exit(1));
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Start the appropriate server based on NODE_ENV
if (process.env.NODE_ENV === 'production') {
  startServer(true).catch((err) => {
    console.error('Failed to start production server:', err);
    process.exit(1);
  });
} else {
  startServer(false).catch((err) => {
    console.error('Failed to start development server:', err);
    process.exit(1);
  });
}
