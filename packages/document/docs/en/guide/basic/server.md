# Server

Rsbuild comes with a built-in dev server designed to improve the development experience. When you run the `rsbuild dev` or `rsbuild preview` commands, the server will start, providing features such as page preview, routing, and hot module reloading.

## Page Routing

Rsbuild Server offers a set of default routing convention, and allows users to customize it through configurations.

### Default Behavior

Rsbuild Server will generate the corresponding page route based on the [source.entry](/config/source/entry) configuration.

When entry is index, the page can be accessed through `/`; when entry is foo, the page can be accessed through `/foo`.

```ts title=rsbuild.config.ts
export default {
  source: {
    entry: {
      index: './src/index.ts',
      foo: './src/pages/foo/index.ts',
    },
  },
};
```

### Fallback Behavior

By default, when the request meets the following conditions and the corresponding resource is not found, it will fallback to `index.html`:

- The request is a `GET` or `HEAD` request
- Which accepts `text/html` (the request header accept type is `text/html` or `*/*`)

```ts title=rsbuild.config.ts
export default {
  server: {
    htmlFallback: 'index',
  },
};
```

### Custom Fallback Behavior

When Rsbuild's default [server.htmlFallback](/config/server/html-fallback) configuration cannot meet your needs, for example, if you want to be able to access `main.html` when accessing `/`, you can set it up using [server.historyApiFallback](/config/server/history-api-fallback).

```ts title=rsbuild.config.ts
export default {
  source: {
    entry: {
      main: './src/index.ts',
    },
  },
  server: {
    htmlFallback: false,
    historyApiFallback: {
      index: '/main.html',
    },
  },
};
```

### HTML Output Path

Normally, `/` points to the dist root directory, and the HTML file is output to the dist root directory. At this time, the corresponding HTML page can be accessed through `/xxx`.

If you output HTML files to other subdirectories by modifying [output.distPath.html](/config/output/dist-path), you need to access the corresponding HTML page through `/htmlPath/xxx`.

For example, if you set the HTML file to be output to the `HTML` directory, index.html will be accessed through `/html/`, and foo.html will be accessed through `/html/foo`.

```ts
export default {
  source: {
    entry: {
      index: './src/index.ts',
      foo: './src/pages/foo/index.ts',
    },
  },
  output: {
    distPath: {
      html: 'html',
    },
  },
};
```

## Comparing Rspack Dev Server

Rsbuild dev server and the dev server of Rspack CLI (`@rspack/dev-server`) share some similarities and differences:

- Both are based on [webpack-dev-middleware](https://github.com/webpack/webpack-dev-middleware).
- They have different configs, with Rsbuild offering a richer set of configurations.
- The log format of Rspack CLI aligns with Webpack CLI, while the logs of Rsbuild are clearer and more readable.

:::tip
Rsbuild applications cannot use Rspack's [devServer](https://rspack.dev/config/dev-server) config. You can configure the behavior of the server through Rsbuild's `dev` and `server` configs, see [Config Overview](/config/index) for details.
:::

## Extend middleware

Rsbuild server does not use any Node.js frameworks, and the `req` and `res` provided by Rsbuild middleware are both native Node.js objects.

This means that when you migrate from other server-side frameworks (such as Express), the original middleware may not necessarily be used directly in Rsbuild. For example, the `req.params`,`req.path`, `req.search`, `req.query` and other properties provided by Express cannot be accessed in the Rsbuild middleware.

If you need to use existing middleware in Rsbuild, this can be done by passing the server application as middleware as follows:

```ts title="rsbuild.config.ts"
import expressMiddleware from 'my-express-middleware';
import express from 'express';

// Initialize Express app
const app = express();

app.use(expressMiddleware);

export default {
  dev: {
    setupMiddlewares: [
      (middleware) => {
        middleware.unshift(app);
      },
    ],
  },
};
```

## Custom Server

If you want to integrate Rsbuild DevServer into an existing Server, you can obtain the instance methods of Rsbuild DevServer through the `createDevServer` method of Rsbuild and call them on demand.

For details, please refer to [Rsbuild - createDevServer](/api/javascript-api/instance#rsbuildcreatedevserver-experimental).
