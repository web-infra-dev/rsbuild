- **Type:** `boolean`
- **Default:** `true`

Remove the folder of the HTML files. When this option is `false`, the generated HTML file path will change from `[name].html` to `[name]/index.html`.

### Example

By default, the structure of HTML files in the `dist` directory is:

```bash
/dist
 └── main.html
```

Use the `html.disableHtmlFolder` config:

```js
export default {
  html: {
    disableHtmlFolder: false,
  },
};
```

After recompiling, the directory structure of the HTML files in dist is:

```bash
/dist
 └── main
     └── index.html
```

> If you want to set the path of the HTML files, use the `output.distPath.html` config.
