- **类型：**

```js
{
  writeToDisk: boolean | ((filename: string) => boolean);
}
```

- **默认值：**

```js
{
  writeToDisk: (file: string) => !file.includes('.hot-update.'),
}
```

devMiddleware 配置项。当前配置是 [webpack-dev-middleware](https://github.com/webpack/webpack-dev-middleware) 配置项的子集.
