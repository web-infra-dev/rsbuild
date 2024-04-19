# security.nonce

- **类型：**

```ts
type Nonce = string;
```

- **默认值：** `undefined`

为 HTML 所引入的脚本资源添加随机属性值 nonce，使浏览器在解析到带有匹配 nonce 值的内联脚本时，能判断该脚本是否能执行。

#### nonce 介绍

nonce 机制在 Content Security Policy（CSP，内容安全策略）中起到关键作用，用于提升网页安全性。其允许开发者在 CSP 中为内联 `<script>` 标签和 `<style` 标签定义一个唯一且随机的字符串值，即 `nonce`。

浏览器在解析到带有匹配 `nonce` 值的内联脚本时，会允许其执行或应用，否则 CSP 将阻止其运行。这样可以有效地防止潜在的跨站脚本（XSS）攻击。值得注意的是，每次页面加载时，都应该生成新的 nonce 值。

关于 nonce 的更多内容，可以参考：

- [nonce - MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce)
- [webpack - Content Security Policies](https://webpack.js.org/guides/csp/)

### 示例

默认情况下，Rsbuild 不会开启 `nonce`，你可以按照需求定义该值：

```js
export default {
  security: {
    nonce: 'CSP_NONCE_PLACEHOLDER',
  },
};
```

通常，我们可以在项目中可以定义一个固定值，并在 Nginx、Web Server、网关等响应下游的服务器上，统一替换成随机值。

### 生效范围

`security.nonce` 选项会为以下标签添加 nonce 属性：

- 由 Rsbuild 生成的所有 `<script>` 标签
- 由 Rsbuild 生成的所有 `<style>` 标签
- 由 Rspack 动态生成的 `<script>` 标签（通过 [\_\_webpack_nonce\_\_](https://webpack.js.org/guides/csp/) 变量实现）

对于 HTML 模板文件中已存在的 `<script>` 或 `<style>` 标签，Rsbuild 不会对其进行修改，你可以直接在模板中添加 `nonce` 属性。

对于通过 JavaScript 动态插入的 `<script>` 或 `<style>` 标签，同样需要自行设置 `nonce` 属性。
