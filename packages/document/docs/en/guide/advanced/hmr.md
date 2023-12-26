# Hot Module Replacement

Hot Module Replacement (HMR) exchanges, adds, or removes modules while an application is running, without a full reload. This can significantly speed up development in a few ways:

- Retain application state which is lost during a full reload.
- Save valuable development time by only updating what's changed.
- Instantly update the browser when modifications are made to CSS / JS in the source code, which is almost comparable to changing styles directly in the browser's dev tools.

## HMR Toggle

Rsbuild has built-in support for HMR, which is enabled by default during development.

If you do not need to use HMR, you can set [dev.hmr](/config/dev/hmr) to `false`. This will disable HMR and react-refresh will, and Rsbuild will automatically fallback to [dev.liveReload](/config/dev/live-reload).

```ts title="rsbuild.config.ts"
export default {
  dev: {
    hmr: false,
  },
};
```

If you need to disable both HMR and liveReload, you can set both [dev.hmr](/config/dev/hmr) and [dev.liveReload](/config/dev/live-reload) to `false`. Then, no Web Socket requests will be made to the dev server on the page, and the page will not automatically refresh when files change.

```js title="rsbuild.config.ts"
export default {
  dev: {
    hmr: false,
    liveReload: false,
  },
};
```

## Specify HMR URL

By default, Rsbuild uses the host and port number of the current page to splice the WebSocket URL of HMR.

When the HMR connection fails, you can specify the WebSocket URL by customizing `dev.client` configuration.

### Default Config

The default config are as follows, Rsbuild will automatically deduce the URL of the WebSocket request according to the current location:

```ts
export default {
  dev: {
    client: {
      path: '/rsbuild-hmr',
      // Equivalent to port of the dev server
      port: '',
      // Equivalent to location.hostname
      host: '',
      // Equivalent to location.protocol === 'https:' ? 'wss' : 'ws'
      protocol: '',
    },
  },
};
```

### Proxy

If you are proxying an online page to local development, WebSocket requests will fail to connect. You can try configuring `dev.client` to the following values so that HMR requests can reach the local Dev Server.

```ts
export default {
  dev: {
    client: {
      host: 'localhost',
      protocol: 'ws',
    },
  },
};
```

## FAQ

Please refer to [HMR FAQ](/guide/faq/hmr).
