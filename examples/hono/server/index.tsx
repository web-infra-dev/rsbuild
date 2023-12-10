import { KVNamespace } from '@cloudflare/workers-types';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { serveStatic } from 'hono/cloudflare-workers';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';

const manifest = JSON.parse(manifestJSON);

interface Bindings extends Record<string, unknown> {
  CDN_BASEURL: string;
  __STATIC_CONTENT: KVNamespace;
}

const app = new Hono<{ Bindings: Bindings }>();

const { serverRender } = require('../build/renderer');

app.get('/static/*', serveStatic({ root: './' }));

app.get('*', async (c) => {
  const templ = await c.env.__STATIC_CONTENT.get(manifest['index.html']);
  if (templ) {
    const html = templ.replace(
      '<div id="root"></div>',
      `<div id="root">${serverRender()}</div>`,
    );
    return c.html(html);
  } else {
    throw new HTTPException(500);
  }
});

export default app;
