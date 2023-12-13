# Page Route

This chapter will introduces how to access pages during local development and preview.

### Default

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

### Default fallback logic

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

#### Custom fallback logic

When Rsbuild's default [server.htmlFallback](/config/server/html-fallback) configuration cannot meet your needs, for example, if you want to be able to access `main.html` when accessing `/`, you can set it up using [server.historyApiFallback] (/config/server/history-api-fallback).

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

### The HTML file output path and Route

Normally, `/` points to the dist root directory, and the HTML file is output to the dist root directory. At this time, the corresponding HTML page can be accessed through `/xxx`.

If you output HTML files to other subdirectories by modifying [output.distPath.html](/config/output/dist-path), you need to access the corresponding HTML page through `/htmlPath/xxx`.

For example, if you set the HTML file to be output to the `HTML` directory, index.html will be accessed through `/html/`, and foo.html will be accessed through `/html/foo`.

```
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
