- **Type:** `string | Function`
- **Default:**

Specifies the file path for the HTML template, which can be a relative or absolute path.

If `template` is not specified, the built-in HTML template of Rsbuild will be used by default:

```html
<!doctype html>
<html>
  <head></head>
  <body>
    <div id="<%= mountId %>"></div>
  </body>
</html>
```

### String Usage

For example, to replace the default HTML template with the `static/index.html` file, you can add the following configuration:

```js
export default {
  html: {
    template: './static/index.html',
  },
};
```

### Function Usage

- **Type:**

```ts
type TemplateFunction = ({ value: string; entryName: string }) => string | void;
```

When `html.template` is of type Function, the function receives an object as an argument, with the following properties:

- `value`: the default template configuration of Rsbuild.
- `entryName`: the name of the current entry.

In the MPA (multi-page application) scenario, you can return different `template` paths based on the entry name, thus setting different templates for each page:

```js
export default {
  html: {
    template({ entryName }) {
      const templates = {
        foo: './static/foo.html',
        bar: './static/bar.html',
      };
      return templates[entryName] || './static/index.html';
    },
  },
};
```
