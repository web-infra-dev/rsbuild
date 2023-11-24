- **Type:** `Object | Function`
- **Default:**

```ts
const defaultMeta = {
  // <meta charset="UTF-8" />
  charset: {
    charset: 'UTF-8',
  },
  // <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  viewport: 'width=device-width, initial-scale=1.0',
};
```

Configure the `<meta>` tag of the HTML.

:::tip
If the HTML template used in the current project already contains the charset or viewport meta tags, then the tags in the HTML template take precedence.
:::

### String Type

- **Type:**

```ts
type MetaOptions = {
  [name: string]: string;
};
```

When the `value` of a `meta` object is a string, the `key` of the object is automatically mapped to `name`, and the `value` is mapped to `content`.

For example to set description:

```js
export default {
  html: {
    meta: {
      description: 'a description of the page',
    },
  },
};
```

The generated `meta` tag in HTML is:

```html
<meta name="description" content="a description of the page" />
```

### Object Type

- **Type:**

```ts
type MetaOptions = {
  [name: string]:
    | string
    | false
    | {
        [attr: string]: string | boolean;
      };
};
```

When the `value` of a `meta` object is an object, the `key: value` of the object is mapped to the attribute of the `meta` tag.

In this case, the `name` and `content` properties will not be set by default.

For example to set `charset`:

```js
export default {
  html: {
    meta: {
      charset: {
        charset: 'UTF-8',
      },
    },
  },
};
```

The `meta` tag in HTML is:

```html
<meta charset="UTF-8" />
```

### Function Usage

- **Type:**

```ts
type MetaFunction = ({
  value: MetaOptions,
  entryName: string,
}) => MetaOptions | void;
```

When `html.meta` is of type `Function`, the function receives an object as an argument with the following properties:

- `value`: the default meta configuration of Rsbuild.
- `entryName`: the name of the current entry.

You can directly modify the configuration object and not return anything, or you can return an object as the final configuration.

For example, you can directly modify the built-in `meta` configuration object:

```js
export default {
  html: {
    meta({ value }) {
      value.description = 'this is my page';
      return value;
    },
  },
};
```

In the MPA (Multi-Page Application) scenario, you can return different `meta` configurations based on the entry name, thus generating different `meta` tags for each page:

```js
export default {
  html: {
    meta({ entryName }) {
      switch (entryName) {
        case 'foo':
          return {
            description: 'this is foo page',
          };
        case 'bar':
          return {
            description: 'this is bar page',
          };
        default:
          return {
            description: 'this is other pages',
          };
      }
    },
  },
};
```

### Remove Default Value

Setting the `value` of the `meta` object to `false` and the meta tag will not be generated.

For example to remove the `viewport`:

```ts
export default {
  html: {
    meta: {
      viewport: false,
    },
  },
};
```
