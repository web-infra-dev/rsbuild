- **Type:** `'entry' | 'usage' | 'off'`
- **Default:** `'usage'`

Through the `output.polyfill` option, you can control the injection mode of the polyfills.

### Configuration Options

#### usage

When `output.polyfill` is configured as `'usage'`, Rsbuild will inject the polyfills based on the APIs used in each file.

```ts
export default {
  output: {
    polyfill: 'usage',
  },
};
```

#### entry

When `output.polyfill` is configured as `'entry'`, Rsbuild will inject the polyfills in each entry file.

```ts
export default {
  output: {
    polyfill: 'entry',
  },
};
```

#### off

When `output.polyfill` is configured as `'off'`, Rsbuild will not inject the polyfills, and developers need to ensure code compatibility themselves.

```ts
export default {
  output: {
    polyfill: 'off',
  },
};
```

> Please refer to the [Polyfill Mode](/guide/advanced/browser-compatibility#polyfill-mode) for more details.
