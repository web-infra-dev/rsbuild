- **Type:** `string ｜ Function`
- **Default:** `'Rsbuild App'`

Set the title tag of the HTML page.

### String Usage

`html.title` can be directly set as a string:

```js
export default {
  html: {
    title: 'Example',
  },
};
```

The `title` tag generated in HTML will be:

```html
<title>Example</title>
```

### Function Usage

- **Type:**

```ts
type TitleFunction = ({ value: string; entryName: string }) => string | void;
```

When `html.title` is of type Function, the function receives an object as the argument, and the object's values include:

- `value`: the default title configuration of Rsbuild.
- `entryName`: the name of the current entry.

In the MPA (multi-page application) scenario, you can return different `title` strings based on the entry name, thus generating different `title` tags for each page:

```js
export default {
  html: {
    title({ entryName }) {
      const titles = {
        foo: 'Foo Page',
        bar: 'Bar Page',
      };
      return titles[entryName] || 'Other Page';
    },
  },
};
```
