- **类型：** `'entry' | 'usage' | 'off'`
- **默认值：** `'usage'`

通过 `output.polyfill` 选项，你可以控制 polyfills 的注入方式。

### 配置项

#### usage

当 `output.polyfill` 配置为 `'usage'` 时，Rsbuild 会在每个文件中根据代码中使用的 API 注入 polyfills。

```ts
export default {
  output: {
    polyfill: 'usage',
  },
};
```

#### entry

当 `output.polyfill` 配置为 `'entry'` 时，Rsbuild 会在每个入口文件中注入 polyfills。

```ts
export default {
  output: {
    polyfill: 'entry',
  },
};
```

#### off

当 `output.polyfill` 配置为 `'off'` 时，Rsbuild 不会注入 polyfills，开发者需要自行保证代码的兼容性。

```ts
export default {
  output: {
    polyfill: 'off',
  },
};
```

> 请查看 [Polyfill 方案](/guide/advanced/browser-compatibility#polyfill-mode) 了解详细内容。
