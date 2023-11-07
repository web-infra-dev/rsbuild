- **类型：** `string ｜ Function`
- **默认值：** `undefined`

设置页面的 favicon 图标，可以设置为：

- URL 地址。
- 文件的绝对路径。
- 相对于项目根目录的相对路径。

配置该选项后，在编译过程中会自动将图标拷贝至 dist 目录下，并在 HTML 中添加相应的 `link` 标签。

### 示例

设置为相对路径：

```js
export default {
  html: {
    favicon: './src/assets/icon.png',
  },
};
```

设置为绝对路径：

```js
import path from 'path';

export default {
  html: {
    favicon: path.resolve(__dirname, './src/assets/icon.png'),
  },
};
```

设置为 URL：

```js
import path from 'path';

export default {
  html: {
    favicon: 'https://foo.com/favicon.ico',
  },
};
```

重新编译后，HTML 中自动生成了以下标签：

```html
<link rel="icon" href="/favicon.ico" />
```

### 函数用法

- **类型：**

```ts
type FaviconFunction = ({ value: string; entryName: string }) => string | void;
```

当 `html.favicon` 为 Function 类型时，函数接收一个对象作为入参，对象的值包括：

- `value`：Rsbuild 的默认 favicon 配置。
- `entryName`: 当前入口的名称。

在 MPA（多页面应用）场景下，你可以基于入口名称返回不同的 `favicon`，从而为每个页面生成不同的标签：

```js
export default {
  html: {
    favicon({ entryName }) {
      const icons = {
        foo: 'https://example.com/foo.ico',
        bar: 'https://example.com/bar.ico',
      };
      return icons[entryName] || 'https://example.com/default.ico';
    },
  },
};
```
