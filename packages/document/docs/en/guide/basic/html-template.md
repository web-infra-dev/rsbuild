# HTML Template

During the build process, Rsbuild will compile based on the HTML template and template parameters to generate several HTML files.

Rsbuild provides some configs to set the HTML template. Through this chapter, you can learn the basic usage of these configs.

## Set Template

In Rsbuild, you can use [html.template](/config/options/html.html#htmltemplate) config to define the path to the custom HTML template.

```ts
export default {
  html: {
    template: './static/index.html',
  },
};
```

## Set Page Title

You can set the HTML `<title>` tag through the [html.title](/config/options/html.html#htmltitle) config.

When there is only one page in your project, just use the `html.title` setting directly:

```ts
export default {
  html: {
    title: 'example',
  },
};
```

When your project has multiple pages, you can set corresponding titles for different pages based on the entry name.

```ts
export default {
  html: {
    title({ entryName }) {
      const titles = {
        foo: 'Foo',
        bar: 'Bar',
      };
      return titles[entryName];
    },
  },
};
```

## Set Page Icon

Rsbuild supports setting [favicon](https://developer.mozilla.org/en-US/docs/Glossary/Favicon) icon and [apple-touch-icon](https://webhint.io/docs/user-guide/hints/hint-apple-touch-icons/) icon.

You can set the favicon through the [html.favicon](/config/options/html.html#htmlfavicon) config.

```ts
export default {
  html: {
    favicon: './src/assets/icon.png',
  },
};
```

You can also set the apple-touch-icon for iOS system through the [html.appIcon](/config/options/html.html#htmlappicon) config.

```ts
export default {
  html: {
    appIcon: './src/assets/icon.png',
  },
};
```

## Set Meta Tags

You can set the meta tags through the [html.meta](/config/options/html.html#htmlmeta) config.

For example to setting description:

```ts
export default {
  html: {
    meta: {
      description: 'a description of the page',
    },
  },
};
```

The generated meta tag in HTML is:

```html
<meta name="description" content="a description of the page" />
```

## Set Template Parameters

In HTML templates, you can use a variety of template parameters. The template parameters injected by Rsbuild by default include:

```ts
type DefaultParameters = {
  meta: string; // corresponding to html.meta config
  title: string; // corresponding to html.title config
  mountId: string; // corresponding to html.mountId config
  entryName: string; // entry name
  assetPrefix: string; // corresponding to output.assetPrefix config
  compilation: webpack.Compilation; // Compilation object corresponding to webpack
  webpackConfig: config; // webpack config
  // htmlWebpackPlugin built-in parameters
  // See https://github.com/jantimon/html-webpack-plugin for details
  htmlWebpackPlugin: {
    tags: object;
    files: object;
    options: object;
  };
};
```

You can also use the [html.templateParameters](/config/options/html.html#htmltemplateparameters) and [html.templateParametersByEntries](/config/options/html.html#htmltemplateparametersbyentries) configs to pass in custom template parameters.

For example:

```ts
export default {
  html: {
    templateParameters: {
      text: 'World',
    },
  },
};
```

Then you can read parameters in the HTML template with `<%= text %>`:

```js
<div>hello <%= text %>!</div>
```

The generated HTML code is as follows:

```js
<div>hello world!</div>
```

## Template Engine

Rsbuild supports using [Lodash Template](https://www.lodashjs.com/docs/lodash.template), [EJS](https://ejs.co/), [Pug](https://pugjs.org/) as template engines, the most basic Lodash Template is used as the default template engine.

### [Lodash Template](https://www.lodashjs.com/docs/lodash.template)

When the suffix of the template is `.html`, Rsbuild will use Lodash Template to compile it.

For example, if you define a `text` parameter in a template with a value of `'world'`, Rsbuild will automatically replace `<%= text %>` with the value.

```html
<!-- input -->
<div>hello <%= text %>!</div>

<!-- output -->
<div>hello world!</div>
```

Please read the [Lodash Template](https://www.lodashjs.com/docs/lodash.template) documentation for details.

### [EJS](https://ejs.co/)

When the suffix of the template is `.ejs`, Rsbuild will use the EJS template engine to compile it. EJS is a simple templating language that lets you generate HTML markup with plain JavaScript.

For example, you can first refer to a `.ejs` template through the [html.template](/config/options/html.html#htmltemplate) config:

```ts
export default {
  html: {
    template: './static/index.ejs',
  },
};
```

Then define a `user` parameter in the template with a value of `{ name: 'Jack' }`. Rsbuild will automatically replace `<%= user.name %>` with the value.

```html
<!-- input -->
<% if (user) { %>
<h2><%= user.name %></h2>
<% } %>

<!-- output -->
<h2>Jack</h2>
```

Please read the [EJS](https://ejs.co/) documentation for details.

### [Pug](https://pugjs.org/)

Rsbuild supports the Pug template engine through the Pug plugin. Please refer to the [Pug plugin documentation](/plugins/list/plugin-pug) for usage guide.

## Injecting Tags

The `html.tags` option can be configured to insert any tags into the final generated HTML product.

:::warning Usage Cases
The artifacts of the web application will eventually be referenced directly or indirectly by HTML entries, but most of the time injecting tags directly into HTML is not preferred.
:::

All tags that need to be injected into HTML can be accessed in the template file via the variable `htmlWebpackPlugin.tags`.

```html
<html>
  <head>
    <%= htmlWebpackPlugin.tags.headTags %>
  </head>
  <body>
    <%= htmlWebpackPlugin.tags.bodyTags %>
  </body>
</html>
```

The purpose of `html.tags` is to adjust these template variables and thus modify the HTML, as defined in [API References](/config/options/html.html#htmltags).

### Tag Object

```ts
export default {
  output: {
    assetPrefix: '//example.com/'
  },
  html: {
    tags: [
      { tag: 'script', attrs: { src: 'a.js' } },
      { tag: 'script', attrs: { src: 'b.js' }, append: false },
      { tag: 'link', attrs: { href: 'style.css', rel: 'stylesheet' }, append: true }
      { tag: 'link', attrs: { href: 'page.css', rel: 'stylesheet' }, publicPath: false }
      { tag: 'script', attrs: { src: 'c.js' }, head: false },
      { tag: 'meta', attrs: { name: 'referrer', content: 'origin' } },
    ],
  },
};
```

The final insertion position of the tag is determined by the `head` and `append` options, and two elements with the same configuration will be inserted into the same area and hold their relative positions to each other.

The `publicPath` configuration is enabled by default for tags, the value of `output.assetPrefix` will be stitched to the `src` property of the `script` tag that represents the path.

So the HTML output built with the above configuration will look like this.

```html
<html>
  <head>
    <script src="//example.com/b.js"></script>
    <link href="//example.com/style.css" rel="stylesheet" />
    <link href="page.css" rel="stylesheet" />
    <!-- some other headTags... -->
    <script src="//example.com/a.js"></script>
    <meta name="referrer" content="origin" />
  </head>
  <body>
    <!-- some other bodyTags... -->
    <script src="//example.com/c.js"></script>
  </body>
</html>
```

### Tags Handler

`html.tags` also accepts a callback function, which is often used to modify the list of tags or to ensure their relative position while inserting them.

```ts
export default {
  html: {
    tags: [
      (tags) => {
        tags.splice(0, 1);
      },
      { tag: 'script', attrs: { src: 'a.js' }, head: false },
      { tag: 'script', attrs: { src: 'b.js' }, append: false },
      { tag: 'script', attrs: { src: 'c.js' } },
      (tags) => [...tags, { tag: 'script', attrs: { src: 'd.js' } }],
    ],
  },
};
```

And you will get:

```html
<html>
  <head>
    <!-- some other headTags... -->
    <script src="//example.com/c.js"></script>
    <script src="//example.com/d.js"></script>
  </head>
  <body>
    <!-- some other bodyTags... -->
    <script src="//example.com/a.js"></script>
  </body>
</html>
```
