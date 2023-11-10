- **Type:**

```js
{
  writeToDisk: boolean | ((filename: string) => boolean);
}
```

- **Default:**

```js
{
  writeToDisk: (file: string) => !file.includes('.hot-update.'),
}
```

The config of devMiddleware. Current options is the subset of [webpack-dev-middleware](https://github.com/webpack/webpack-dev-middleware).
