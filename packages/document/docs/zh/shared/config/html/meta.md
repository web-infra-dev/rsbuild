- **类型：** `Object | Function`
- **默认值：**

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

配置 HTML 页面的 `<meta>` 标签。

:::tip
如果当前项目使用的 HTML 模板中已经包含了 `charset` 或 `viewport` meta 标签，那么 HTML 模板中的标签优先级更高。
:::

### String 类型

- **类型：**

```ts
type MetaOptions = {
  [name: string]: string;
};
```

当 `meta` 对象的 `value` 为字符串时，会自动将对象的 `key` 映射为 `name`，`value` 映射为 `content`。

比如设置 `description`：

```js
export default {
  html: {
    meta: {
      description: 'a description of the page',
    },
  },
};
```

最终在 HTML 中生成的 `meta` 标签为：

```html
<meta name="description" content="a description of the page" />
```

### Object 类型

- **类型：**

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

当 `meta` 对象的 `value` 为对象时，会将该对象的 `key: value` 映射为 `meta` 标签的属性。

比如设置 `charset`：

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

最终在 HTML 中生成的 `meta` 标签为：

```html
<meta charset="UTF-8" />
```

### 函数用法

- **类型：**

```ts
type MetaFunction = ({
  value: MetaOptions,
  entryName: string,
}) => MetaOptions | void;
```

当 `html.meta` 为 Function 类型时，函数接收一个对象作为入参，对象的值包括：

- `value`：Rsbuild 的默认 meta 配置。
- `entryName`: 当前入口的名称。

你可以直接修改配置对象不做返回，也可以返回一个对象作为最终的配置。

比如，你可以直接修改内置的 `meta` 配置对象：

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

在 MPA（多页面应用）场景下，你可以基于入口名称返回不同的 `meta` 配置，从而为每个页面生成不同的 `meta` 标签：

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

### 移除默认值

将 `meta` 对象的 `value` 设置为 `false`，则表示不生成对应的 meta 标签。

比如移除 Rsbuild 预设的 `viewport`：

```ts
export default {
  html: {
    meta: {
      viewport: false,
    },
  },
};
```
