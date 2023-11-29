- **Type:** `string`
- **Default:** `0.0.0.0`

Specify the host that the Rsbuild Server listens to.

By default, the Rsbuild Server will listen to `0.0.0.0`, which means listening to all network interfaces, including `localhost` and public network addresses.

You can use `server.host` or the `--host` CLI param to set the host (The priority of `--host` option is higher than `server.host`).

If you want the Rsbuild Server to listen only on `localhost`, you can set it to:

```ts
export default {
  server: {
    host: 'localhost',
  },
};
```
