# Import Static Assets

Rsbuild supports import static assets, including images, fonts, and medias.

:::tip What is Static Assets
Static assets are files that are part of a web application and do not change, even when the application is being used. Examples of static assets include images, fonts, medias, stylesheets, and JavaScript files. These assets are typically stored on a web server or CDN, and delivered to the user's web browser when the Web application is accessed. Because they do not change, static assets can be cached by the browser, which helps to improve the performance of the Web application.
:::

## Assets Format

The following are the formats supported by Rsbuild by default:

- **image**: png, jpg, jpeg, gif, svg, bmp, webp, ico, apng, avif, tif, tiff, jfif, pjpeg, pjp.
- **fonts**: woff, woff2, eot, ttf, otf, ttc.
- **audio**: mp3, wav, flac, aac, m4a, opus.
- **video**: mp4, webm, ogg, mov.

If you need to import assets in other formats, please refer to [Extend Asset Types](#extend-asset-types).

:::tip SVG images
SVG image is a special case. Rsbuild support convert SVG to React components, so SVG is processed separately. For details, see [SVGR Plugin](/plugins/list/plugin-svgr).
:::

## Import Assets in JS file

In JS files, you can directly import static assets in relative paths:

```tsx
// Import the logo.png image in the static directory
import logo from './static/logo.png';

export default = () => <img src={logo} />;
```

Import with [alias](/guide/advanced/alias) are also supported:

```tsx
import logo from '@/static/logo.png';

export default = () => <img src={logo} />;
```

## Import Assets in CSS file

In CSS files, you can reference static assets in relative paths:

```css
.logo {
  background-image: url('../static/logo.png');
}
```

Import with [alias](/guide/advanced/alias) are also supported:

```css
.logo {
  background-image: url('@/static/logo.png');
}
```

## Import Results

The result of importing static assets depends on the file size:

- When the file size is greater than 10KB, a URL will be returned, and the file will be output to the dist directory.
- When the file size is less than 10KB, it will be automatically inlined to Base64 format.

```js
import largeImage from './static/largeImage.png';
import smallImage from './static/smallImage.png';

console.log(largeImage); // "/static/largeImage.6c12aba3.png"
console.log(smallImage); // "data:image/png;base64,iVBORw0KGgo..."
```

For a more detailed introduction to asset inlining, please refer to the [Static Asset Inlining](/guide/optimization/inline-assets) chapter.

## Output Files

When static assets are imported, they will be output to the dist directory. You can:

- Modify the output filename through [output.filename](/config/output/filename).
- Modify the output path through [output.distPath](/config/output/dist-path).

Please read [Output Files](/guide/basic/output-files) for details.

## URL Prefix

The URL returned after importing a asset will automatically include the path prefix:

- In development, using [dev.assetPrefix](/config/dev/asset-prefix) to set the path prefix.
- In production, using [output.assetPrefix](/config/output/asset-prefix) to set the path prefix.

For example, you can set `output.assetPrefix` to `https://example.com`:

```js
import logo from './static/logo.png';

console.log(logo); // "https://example.com/static/logo.6c12aba3.png"
```

## Public Folder

The public folder at the project root can be used to place some static assets. These assets will not be bundled by Rsbuild.

- When you start the dev server, these assets will be served under the root path, `/`.
- When you perform a production build, these assets will be copied to the dist directory.

For example, you can place files such as `robots.txt`, `manifest.json`, or `favicon.ico` in the public folder.

### Reference Method

In the HTML template, you can refer to the files in the public folder as follows. The `assetPrefix` is the URL prefix of the static assets.

```html title="index.html"
<link rel="icon" href="<%= assetPrefix %>/favicon.ico" />
```

In JavaScript code, you can splice the URL via `process.env.ASSET_PREFIX`:

```js title="index.js"
const faviconURL = `${process.env.ASSET_PREFIX}/favicon.ico`;
```

### Custom Behavior

Rsbuild provides the [server.publicDir](/config/server/public-dir) option which can be used to customize the name and behavior of the public folder, as well as to disable it.

```ts title="rsbuild.config.ts"
export default {
  server: {
    publicDir: false,
  },
};
```

### Notes

- Avoid importing files from the public folder into your source code, instead reference them by URL.
- When referencing resources in the public folder via URL, please use absolute paths instead of relative paths.
- During the production build, the files in public folder will be copied to the output folder (default is `dist`). Please be careful to avoid name conflicts with the output files. When files in the `public` folder have the same name as outputs, the outputs have higher priority and will overwrite the files with the same name in the `public` folder. This feature can be disabled by setting `server.publicDir.copyOnBuild` to false.

## Type Declaration

When you import static assets in TypeScript code, TypeScript may prompt that the module is missing a type definition:

```
TS2307: Cannot find module './logo.png' or its corresponding type declarations.
```

To fix this, you need to add a type declaration file for the static assets, please create a `src/env.d.ts` file, and add the corresponding type declaration.

- Method 1: If the `@rsbuild/core` package is installed, you can directly reference the type declarations provided by `@rsbuild/core`:

```ts
/// <reference types="@rsbuild/core/types" />
```

- Method 2: Manually add the required type declarations:

```ts title="src/env.d.ts"
// Taking png images as an example
declare module '*.png' {
  const content: string;
  export default content;
}
```

After adding the type declaration, if the type error still exists, you can try to restart the current IDE, or adjust the directory where `env.d.ts` is located, making sure the TypeScript can correctly identify the type definition.

## Extend Asset Types

If the built-in asset types in Rsbuild cannot meet your requirements, you can modify the built-in Rspack configuration and extend the asset types you need using [tools.rspack](/config/tools/rspack).

For example, if you want to treat `*.pdf` files as assets and directly output them to the dist directory, you can add the following configuration:

```ts title="rsbuild.config.ts"
export default {
  tools: {
    rspack(config, { addRules }) {
      addRules([
        {
          test: /\.pdf$/,
          // converts asset to a separate file and exports the URL address.
          type: 'asset/resource',
        },
      ]);
    },
  },
};
```

After adding the above configuration, you can import `*.pdf` files in your code, for example:

```js
import myFile from './static/myFile.pdf';

console.log(myFile); // "/static/myFile.6c12aba3.pdf"
```

For more information about asset modules, please refer to [Rspack - Asset modules](https://rspack.dev/guide/asset-module#asset-modules).

## Custom Rules

In some scenarios, you may need to bypass the built-in assets processing rules of Rsbuild and add some custom rules.

Taking PNG image as an example, you need to:

1. Modify the built-in Rspack config via [tools.bundlerChain](/config/tools/bundler-chain) to exclude `.png` files using the `exclude` method.
2. Add custom asset processing rules via [tools.rspack](/config/tools/rspack).

```ts title="rsbuild.config.ts"
export default {
  tools: {
    bundlerChain(chain, { CHAIN_ID }) {
      chain.module
        // Use `CHAIN_ID.RULE.IMAGE` to locate the built-in image rule
        .rule(CHAIN_ID.RULE.IMAGE)
        .exclude.add(/\.png$/);
    },
    rspack(config, { addRules }) {
      addRules([
        {
          test: /\.png$/,
          // Add a custom loader to handle png images
          loader: 'custom-png-loader',
        },
      ]);
    },
  },
};
```

## Image Format

When using image assets, you can choose a appropriate image format according to the pros and cons in the table below.

| Format | Pros                                                                                                      | Cons                                                                                | Scenarios                                                                                                                                              |
| ------ | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PNG    | Lossless compression, no loss of picture details, no distortion, support for translucency                 | Not suitable for pictures with complex color tables                                 | Suitable for pictures with few colors and well-defined borders, suitable for logos, icons, transparent images and other scenes                         |
| JPG    | Rich colors                                                                                               | Lossy compression, which will cause image distortion, does not support transparency | Suitable for pictures with a large number of colors, gradients, and overly complex pictures, suitable for portrait photos, landscapes and other scenes |
| WebP   | Supports both lossy and lossless compression, supports transparency, and is much smaller than PNG and JPG | iOS compatibility is not good                                                       | Pixel images of almost any scene, and the hosting environment that supports WebP, should prefer WebP image format                                      |
| SVG    | Lossless format, no distortion, supports transparency                                                     | Not suitable for complex graphics                                                   | Suitable for vector graphics, suitable for icons                                                                                                       |
