- **Type:** `'head' | 'body' | boolean | Function`
- **Default:** `'head'`

Set the inject position of the `<script>` tag.

Can be set to the following values:

- `'head'`: The script tag will be inject inside the head tag.
- `'body'`: The script tag is inject at the end of the body tag.
- `true`: The result depends on the scriptLoading config of `html-webpack-plugin`.
- `false`: script tags will not be injected.

#### Default inject position

The script tag is inside the head tag by default:

```html
<html>
  <head>
    <title></title>
    <script defer src="/static/js/runtime-main.js"></script>
    <script defer src="/static/js/main.js"></script>
    <link href="/static/css/main.css" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

#### Inject into body

Add the following config to inject script into the body tag:

```js
export default {
  html: {
    inject: 'body',
  },
};
```

You will see that the script tag is generated at the end of the body tag:

```html
<html>
  <head>
    <title></title>
    <link href="/static/css/main.css" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script defer src="/static/js/runtime-main.js"></script>
    <script defer src="/static/js/main.js"></script>
  </body>
</html>
```

### Function Usage

- **Type:**

```ts
type InjectFunction = ({ value: ScriptInject; entryName: string }) => string | void;
```

When `html.inject` is of type Function, the function receives an object as its parameter, with the following properties:

- `value`: the default inject configuration of Rsbuild.
- `entryName`: the name of the current entry.

In the context of MPA (Multi-Page Application), you can set different `inject` behaviors based on the entry name:

```js
export default {
  html: {
    inject({ entryName }) {
      return entryName === 'foo' ? 'body' : 'head';
    },
  },
};
```
