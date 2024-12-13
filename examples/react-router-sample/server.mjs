import fs from 'node:fs/promises';
import path from 'node:path';
import { createRsbuild, loadConfig } from '@rsbuild/core';
import express from 'express';

const PORT = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 4000;

async function getManifestAssets(routeId) {
  try {
    const manifestPath = path.join(process.cwd(), 'dist/manifest.json');
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);
    const { js = [], css = [] } = manifest.entries.client.initial;

    // Get route-specific assets if routeId is provided
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

async function createSSRHandler(rsbuildServer) {
  return async (req, res, next) => {
    try {
      if (!req.headers.host) {
        const error = new Error('No host header present');
        error.status = 400;
        throw error;
      }

      // Load Node bundle for SSR
      const serverModule =
        await rsbuildServer.environments?.node.loadBundle('server');

      const url = new URL(req.url, `http://${req.headers.host}`);
      const request = new Request(url, {
        method: req.method,
        headers: req.headers,
        ...(req.method !== 'GET' && { body: req.body }),
      });

      // Get route ID from URL path
      const routeId = url.pathname.split('/').pop() || 'home';
      const assets = await getManifestAssets(routeId);
      const response = await serverModule.handler(request, assets);
      const responseText = await response.text();

      res.status(response.status);
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      res.send(responseText);
    } catch (err) {
      console.error('SSR render error:', err);
      if (process.env.NODE_ENV === 'production') {
        res.status(err.status || 500).send('Internal Server Error');
      } else {
        next(err);
      }
    }
  };
}

async function startDevServer() {
  const app = express();

  let rsbuildServer;
  try {
    const { content } = await loadConfig({});
    if (!content) {
      const error = new Error('Failed to load Rsbuild config');
      error.code = 'CONFIG_LOAD_ERROR';
      throw error;
    }

    const rsbuild = await createRsbuild({
      rsbuildConfig: content,
    });

    rsbuildServer = await rsbuild.createDevServer();
  } catch (err) {
    console.error('Failed to initialize Rsbuild:', err);
    process.exit(1);
  }

  // Parse JSON bodies
  app.use(express.json());

  // Use Rsbuild dev middleware first for static assets
  app.use(rsbuildServer.middlewares);

  // Handle SSR requests
  app.all('*', await createSSRHandler(rsbuildServer));

  const httpServer = app.listen(PORT, async () => {
    console.log(`Server started at http://localhost:${PORT}`);
    await rsbuildServer.afterListen();
  });

  rsbuildServer.connectWebSocket({ server: httpServer });

  // Handle graceful shutdown
  const shutdown = (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    httpServer.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    httpServer.close(() => process.exit(1));
  });
}

async function startProdServer() {
  const app = express();
  const distDir = path.join(process.cwd(), 'dist');

  // Verify dist directory exists
  try {
    await fs.access(path.join(distDir, 'web'));
  } catch (err) {
    console.error(
      'Error: Build directory not found. Please run npm run build first.',
    );
    process.exit(1);
  }

  // Initialize Rsbuild for production
  const { content } = await loadConfig({});
  if (!content) {
    const error = new Error('Failed to load Rsbuild config');
    error.code = 'CONFIG_LOAD_ERROR';
    throw error;
  }

  const rsbuild = await createRsbuild({
    rsbuildConfig: content,
  });

  // Parse JSON bodies
  app.use(express.json());

  // Serve static assets with cache headers
  app.use(
    express.static(path.join(distDir, 'web'), {
      maxAge: '1y',
      etag: true,
      immutable: true,
    }),
  );

  // Handle SSR requests using loadBundle
  app.all('*', await createSSRHandler(rsbuild));

  const server = app.listen(PORT, () => {
    console.log(`Production server started at http://localhost:${PORT}`);
  });

  // Handle graceful shutdown
  const shutdown = (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    server.close(() => process.exit(1));
  });
}

// Start the appropriate server based on NODE_ENV
if (process.env.NODE_ENV === 'production') {
  startProdServer().catch((err) => {
    console.error('Failed to start production server:', err);
    process.exit(1);
  });
} else {
  startDevServer().catch((err) => {
    console.error('Failed to start development server:', err);
    process.exit(1);
  });
}
