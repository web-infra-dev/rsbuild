- **Type:**

```ts
{
    /** Specify a protocol to use */
    protocol?: string;
    /** The path which the middleware is serving the event stream on */
    path?: string;
    /** Specify a port number to listen for requests on */
    port?: string;
    /** Specify a host to use */
    host?: string;
}
```

- **Default:**

```js
const defaultConfig = {
  path: '/rsbuild-hmr',
  // By default it is set to the port number of the dev server
  port: '',
  // By default it is set to "location.hostname"
  host: '',
  // By default it is set to "location.protocol === 'https:' ? 'wss' : 'ws'""
  protocol: '',
};
```

The config of HMR client, which are usually used to set the WebSocket URL of HMR.
