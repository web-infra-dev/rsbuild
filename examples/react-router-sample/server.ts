import fs from 'node:fs/promises';
import path from 'node:path';
import { createRsbuild, loadConfig } from '@rsbuild/core';
import type { RsbuildInstance } from '@rsbuild/core';
//@ts-nocheck
import express from 'express';
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction,
} from 'express';
import type { Assets } from './app/context';

const PORT = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 4000;

interface ServerError extends Error {
  status?: number;
  code?: string;
}

interface Manifest {
  entries: {
    [key: string]: {
      initial: {
        js: string[];
        css: string[];
      };
    };
  };
  namedChunks: {
    [key: string]: {
      js?: string[];
      css?: string[];
    };
  };
}

interface ServerModule {
  handler: (request: Request, assets?: Assets) => Promise<Response>;
}

async function getManifestAssets(routeId?: string): Promise<Assets> {
  try {
    const manifestPath = path.join(process.cwd(), 'dist/manifest.json');
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent) as Manifest;
    const { js = [], css = [] } = manifest.entries.client.initial;

    // Get route-specific assets if routeId is provided
    let routeAssets: { js: string[]; css: string[] } = { js: [], css: [] };
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

async function createSSRHandler(rsbuildServer: RsbuildInstance) {
  return async (
    req: ExpressRequest,
    res: ExpressResponse,
    next: NextFunction,
  ) => {
    try {
      if (!req.headers.host) {
        const error: ServerError = new Error('No host header present');
        error.status = 400;
        throw error;
      }

      // Load Node bundle for SSR
      const serverModule = (await rsbuildServer.environments?.node.loadBundle(
        'server',
      )) as ServerModule;

      const url = new URL(req.url, `http://${req.headers.host}`);
      const request = new Request(url, {
        method: req.method,
        headers: req.headers as HeadersInit,
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
      const error = err as ServerError;
      console.error('SSR render error:', error);
      if (process.env.NODE_ENV === 'production') {
        res.status(error.status || 500).send('Internal Server Error');
      } else {
        next(error);
      }
    }
  };
}

async function startDevServer() {
  const app = express();

  let rsbuildServer: RsbuildDevServer;
  try {
    const { content } = await loadConfig({});
    if (!content) {
      const error: ServerError = new Error('Failed to load Rsbuild config');
      error.code = 'CONFIG_LOAD_ERROR';
      throw error;
    }

    const rsbuild = await createRsbuild({
      rsbuildConfig: content,
    });

    rsbuildServer = await rsbuild.createDevServer();
  } catch (err) {
    const error = err as ServerError;
    console.error('Failed to initialize Rsbuild:', error);
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
  const shutdown = (signal: string) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    httpServer.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (err: Error) => {
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
    const error: ServerError = new Error('Failed to load Rsbuild config');
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
  const shutdown = (signal: string) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (err: Error) => {
    console.error('Uncaught exception:', err);
    server.close(() => process.exit(1));
  });
}

// Start the appropriate server based on NODE_ENV
if (process.env.NODE_ENV === 'production') {
  startProdServer().catch((err: Error) => {
    console.error('Failed to start production server:', err);
    process.exit(1);
  });
} else {
  startDevServer().catch((err: Error) => {
    console.error('Failed to start development server:', err);
    process.exit(1);
  });
}
