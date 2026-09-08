import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineConfig } from '@rsbuild/core';

type ServerBundle = {
  render: () => { app: string; hydrationScript: string };
};

export default defineConfig({
  server: {
    setup: ({ action, server, environments }) => {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'GET' || req.url !== '/') {
          return next();
        }

        const bundle: ServerBundle =
          action === 'dev'
            ? await server.environments.node.loadBundle<ServerBundle>('index')
            : await import(
                pathToFileURL(
                  path.join(environments.node.distPath, 'index.mjs'),
                ).href
              );
        const template =
          action === 'dev'
            ? await server.environments.web.getTransformedHtml('index')
            : await readFile(
                path.join(environments.web.distPath, 'index.html'),
                'utf8',
              );
        const { app, hydrationScript } = bundle.render();

        res.setHeader('Content-Type', 'text/html');
        res.end(
          template
            .replace('<!--hydration-script-->', hydrationScript)
            .replace('<!--app-content-->', app),
        );
      });
    },
  },
  environments: {
    web: {
      source: {
        entry: {
          index: './src/index',
        },
      },
    },
    node: {
      output: {
        target: 'node',
        filename: { js: '[name].mjs' },
      },
      source: {
        entry: {
          index: './src/index.server',
        },
      },
    },
  },
  html: {
    template: './template.html',
  },
});
