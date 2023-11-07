- **类型：** `Record<string, unknown> | Function`
- **Default:**

```ts
type DefaultParameters = {
  mountId: string; // corresponding to html.mountId config
  entryName: string; // entry name
  assetPrefix: string; // corresponding to output.assetPrefix config
  compilation: Compilation; // Compilation object of Rspack
  // htmlWebpackPlugin built-in parameters
  // See https://github.com/jantimon/html-webpack-plugin for details
  htmlWebpackPlugin: {
    tags: object;
    files: object;
    options: object;
  };
};
```

Define the parameters in the HTML template, corresponding to the `templateParameters` config of [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin).

### Object Usage

If the value of `templateParameters` is an object, it will be merged with the default parameters using `Object.assign`.

For example, if you need to use the `foo` parameter in an HTML template, you can add the following settings:

```js
export default {
  html: {
    templateParameters: {
      foo: 'bar',
    },
  },
};
```

Then, you can read the parameter in the HTML template using `<%= foo %>`:

```html
<script>
  window.foo = '<%= foo %>';
</script>
```

The compiled HTML code will be:

```html
<script>
  window.foo = 'bar';
</script>
```

### Function Usage

- **Type:**

```ts
type TemplateParametersFunction = (
  defaultValue: Record<string, unknown>,
  utils: { entryName: string },
) => Record<string, unknown> | void;
```

When `html.templateParameters` is of type Function, the function receives two parameters:

- `value`: Default `templateParameters` configuration of Rsbuild.
- `utils`: An object containing the `entryName` field, corresponding to the name of the current entry.

In the context of a multi-page application (MPA), you can set different `templateParameters` based on the entry name:

```js
export default {
  html: {
    templateParameters(defaultValue, { entryName }) {
      const params = {
        foo: {
          ...defaultValue,
          type: 'Foo',
        },
        bar: {
          ...defaultValue,
          type: 'Bar',
          hello: 'world',
        },
      };
      return params[entryName] || defaultValue;
    },
  },
};
```
