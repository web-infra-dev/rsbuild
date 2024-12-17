import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequestHandler } from '@react-router/express';
import { createRsbuild, loadConfig } from '@rsbuild/core';
import express from 'express';

// Configuration Constants
const PORT = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 4000;
const FORCE_STREAMING = (process.env.FORCE_STREAMING || 'true') === 'true';

// Asset Management
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

// SSR Handler
async function handleStreamResponse(response, res) {
  if (response.pipe) {
    response.pipe(res);
  } else if (response.body && typeof response.body.pipe === 'function') {
    response.body.pipe(res);
    response.body.on('error', (err) => {
      console.error('Streaming error:', err);
      if (!res.headersSent) {
        res.status(500).send('Streaming error occurred');
      } else {
        res.end();
      }
    });
  }
}

async function handleBufferedResponse(response, res) {
  const text = await response.text();
  res.send(text);
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
      debugger;
      return createRequestHandler(serverModule)(req, res, next);
    } catch (err) {
      console.error('SSR render error:', err);
      next(err);
    }
  };
}

// Server Setup and Configuration
async function startServer(isProduction = false) {
  const app = express();
  let rsbuildServer;

  try {
    // Initialize Rsbuild
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
          streamingPreferred: false,
        });

    // Middleware Setup
    app.use(express.json());

    if (!isProduction) {
      app.use(rsbuildServer.middlewares);
    } else {
      app.use(
        express.static(path.join(process.cwd(), 'dist/web'), {
          maxAge: '1y',
          etag: true,
          immutable: true,
        }),
      );
    }

    // Route Handler
    app.all('*', await createSSRHandler(rsbuildServer, isProduction));

    // Server Startup
    const server = app.listen(PORT, async () => {
      console.log(`Server started at http://localhost:${PORT}`);
      if (!isProduction) {
        await rsbuildServer.afterListen();
      }
    });

    if (!isProduction) {
      rsbuildServer.connectWebSocket({ server });
    }

    // Error Handling
    process.on('uncaughtException', (err) => {
      console.error('Uncaught exception:', err);
      server.close(() => process.exit(1));
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Server Initialization
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
