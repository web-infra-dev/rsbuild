import { createRsbuild, loadConfig } from '@rsbuild/core';
import express from 'express';

const app = express();

const config = await loadConfig();
const rsbuild = await createRsbuild({
  rsbuildConfig: config.content,
});
const devServer = await rsbuild.createDevServer();
app.use(devServer.middlewares);

app.use(async (req, res, next) => {
  try {
    const bundle = /** @type {import("./server/app")} */ (
      await devServer.environments.node.loadBundle('app')
    );
    await bundle.app(req, res, next);
  } catch (e) {
    next(e);
  }
});

const port = Number.parseInt(process.env.PORT || '3000', 10);
const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  devServer.afterListen();
});
devServer.connectWebSocket({ server });
