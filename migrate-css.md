# Migrating to Rspack's built-in CSS

## Enable built-in CSS

For a web build that extracts stylesheets, set the experimental top-level `css` option to `true`.

```ts
import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  css: true,
});
```

Rsbuild uses Rspack's native CSS module type for ordinary CSS imports and CSS entries. PostCSS and Lightning CSS still run when enabled. Entry stylesheets use `output.filename.css` and `output.distPath.css`. Projects that customize CSS Modules should check their imports and class names against Rspack’s native defaults before switching.

This first version keeps the loader pipeline for `?inline`, `?url`, non-web targets, and builds using `output.injectStyles: true` or `output.emitCss: false`. To switch the whole build back to the loader pipeline, set `css: false` or remove the option.

## Compare with the default pipeline

Rsbuild currently uses `css-loader` by default. Before switching an existing project, check how each build environment consumes styles.

| What to check        | Current Rsbuild behavior                                                                                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stylesheet output    | Web builds emit CSS files by default. With `output.injectStyles: true`, JavaScript injects styles into the page at runtime.                                                        |
| Server rendering     | Node.js builds default to `output.emitCss: false`. They still export CSS Modules class names for rendering.                                                                        |
| CSS Modules          | `output.cssModules` controls which files are modules, the generated class names, and their JavaScript exports. Check default and named imports in application code.                |
| Loader customization | Check `tools.cssLoader`, `tools.styleLoader`, and `tools.cssExtract` for behavior that depends on the current pipeline, such as filtering URLs or choosing where to insert styles. |

For a comparison, keep a build from the current configuration. Include an async route if your application loads styles on demand. For SSR, compare the class names rendered by the server with those in the client's stylesheet.
