# @rsbuild/shared

## 0.0.18

### Patch Changes

- 164f135: refactor: extract assetsRetry as a standalone plugin
- 96d9d43: fix: url logs break the progress bar
- 4887d6d: chore: use findUp utils to replace pkg-up dep
- c743a94: refactor: move source.moduleScopes to uni-builder
- faf797a: fix(deps): add missing dependencies to core and shared
- 594c16a: feat: only enable progress bar in production
- 7fe5f26: refactor: move source.globalVars option to uni-builder
- 78d4d94: feat: replace pretty-time and improve time format
- fad683d: feat(cli): add new --open option for dev command

## 0.0.17

### Patch Changes

- b25b47c: feat: support html.template as a function
- 3b87b50: refactor: move html.titleByEntries option to uni-builder
- fd05681: refactor: remove source.compileJsDataURI option
- 6220e04: refactor: merge HTML plugins into a unified plugin
- 41a7938: feat(deps): bump Rspack v0.3.11
- f1f15cf: feat: support html.templateParameters as a function
- 60fc2de: feat: support html.title as a function
- 58e7453: feat: support html.favicon as a function
- 659a2f5: chore: remove cssnano from shared package
- 7ecbc74: feat: support html.inject as a function
- 47078fd: types: fix source.alias type

## 0.0.16

### Patch Changes

- a2a18ec: feat: support html.meta to be a function
- 8f03dd0: refactor: move html.metaByEntries option to uni-builder
- 9a52542: feat: add default meta configs and simplify the templates

## 0.0.15

### Patch Changes

- 25ab68e: refactor: use plugin to generate titles instead of template params

## 0.0.14

### Patch Changes

- 705c6a7: refactor: move legacy manifest config to uni-builder
- a4badc6: perf: using a lighter modern.js server package
- 8f52317: perf: replace chalk with picocolors
- 094cd55: refactor: @rsbuild/core no longer depend on webpack
- c331840: refactor: @rsbuild/shared no longer depend on webpack

## 0.0.13

### Patch Changes

- 9c19198: refactor: simplify RsbuildConfig definitions
- fedbe79: refactor: use plugin to generate meta tags instead of template params
- 219dd60: chore(deps): bump Rspack v0.3.9
- b46bc69: refactor: replace @rspack/html-plugin with html-webpack-plugin
- 3bf93a5: refactor: extract css-minimizer plugin as a standalone package
- 84a4d61: chore(utils): unify the castArray implementation
- 510de48: perf: switch the default polyfill mode to usage
- 73ec291: perf: remove config validation

## 0.0.12

## 0.0.11

### Patch Changes

- 70c39ed: perf: reduce builtin PostCSS plugins
- 18f3997: fix(schema): add missing tools schemas
- d5ed6d6: refactor: extract checkSyntax plugin as a standalone package
- b07fdba: refactor: move babel helpers to plugin-babel

## 0.0.10

## 0.0.9

## 0.0.8

### Patch Changes

- 90cf710: feat(rsbuild/shared): init @rsbuild/shared
- af1da01: chore: remove modern-web target
- ce80b80: feat: flatten the output html files
- 349df6f: feat: adjust the default browserslist config
- d57dcec: chore: replace modern.js logger with rslog

## 0.0.7

## 0.0.6

## 0.0.5

## 0.0.4

### Patch Changes

- 258a78d: feat(babel-preset): add support for preset-env and preset-typescript
- d887c9e: fix(babel-preset): should not register dynamic-import-node plugin for web

## 0.0.3

### Patch Changes

- 9d47606: chore: extract shared dependencies
