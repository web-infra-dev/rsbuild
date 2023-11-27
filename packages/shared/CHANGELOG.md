# @rsbuild/shared

## 0.1.3

### Patch Changes

- c4bebdc0: feat(cli): support preview --open option
- 90c1534: feat(core): support printFileSize.detail and printFileSize.total
- 5045dcb4: types: unify compiler type, use Rspack compiler by default
- da1a825: fix: preload resource cannot be used when crossOrigin attr does not match
- 0832fadc: perf(plugin-rem): use define to inject version
- e2e80482: feat: add plugins hooks for prod server

## 0.1.2

## 0.1.1

### Patch Changes

- c3843417: chore(shared): remove unused CHAIN_ID
- 576d983: chore: inject meta tags via html-rspack-plugin

## 0.1.0

### Minor Changes

- b2eeaed: feat(deps): bump Rspack v0.4.0

### Patch Changes

- a59d099: refactor: rename output.enableInlineStyles to output.inlineStyles
- 12bc79ba: feat: add basic support for env files
- f08e2f1: refactor: rename `server.compress` to support preview server
- 686987d: refactor: rename `server.historyApiFallback` to support preview server
- 6d19338: feat: support uppercase debug flags
- 0454cae8: refactor: rename `dev.proxy` to `server.proxy` to support preview server
- 67a79efd: feat(cli): set 300ms debounce to avoid restart frequently
- b2831a5: refactor: rename `dev.devMiddleware` to `dev.writeToDisk`

## 0.0.28

### Patch Changes

- 0f95693: perf: reduce aggregateTimeout to speed up HMR

## 0.0.27

### Patch Changes

- e7b5c5b1: fix(react): failed to split react chunks if override chunkSplit
- bd31bae2: types: simplify BundlerChain and BundlerConfig
- 8c9b66d: refactor(plugin-react): move component chunks to uni-builder
- cd05514: refactor: prebundle http-proxy-middleware and adjust implementation
- 780c859: perf: bump html-rspack-plugin v5.5.7 to reduce deps

## 0.0.26

### Patch Changes

- b09444e: perf(deps): prebundle sirv and jiti
- d81757d5: fix(cli): fix version and improve perf
- 6822ca4: feat: add context.version property

## 0.0.25

### Patch Changes

- 4608604: refactor: move resolveMainFields option to uni-builder
- c1a5e24: refactor: move configPath option to uni-builder
- 8c698e4: chore(deps): bump Rspack v0.3.14

## 0.0.24

### Patch Changes

- 86e7b25: refactor: remove context.srcPath
- 289dc9a: fix: should not print entry error when entry is set by plugins
- e8c252f: fix: context should be updated after modifyRsbuildConfig hook
- 53f8b52: fix: should register config.plugins when using JavaScript API
- f5b397b: feat: handle errors when CLI command failed
- ed966e0: fix(deps): bump Rspack 0.3.13 to fix new Class error

## 0.0.23

### Patch Changes

- 2f124f6d: perf: prebundle gzip-size, rslog and more
- 8d884d7: refactor: always use source.entries to set entry
- 0dbf692: refactor: rename source.entries to source.entry
- 254b220: feat: support use index.cjs or index.mjs as the default entry

## 0.0.22

### Patch Changes

- 64e1913a: perf(deps): prebundle connect and open
- 34255e7: perf: prebundle browserslist and bump autoprefixer
- 1151c677: refactor: extract rem as a standalone plugin
- 7aeebf41: refactor: move disableCssModuleExtension config to uni-builder
- f0f0627: feat(deps): bump Rspack v0.3.12
- 190b8c2: feat: always compile TS and JSX files

## 0.0.21

### Patch Changes

- 42ace29: chore: using exports.types to replace typesVersion
- c90bebe: perf: prebundle picocolors dependency
- a919119: chore(core): remove lodash dependency
- 0270c27: feat(cli): restart dev server when config file changed
- a58e71c: perf(shared): prebundle webpack-chain and webpack-sources
- dbdc3c5: hotfix(server): should print url with distPath.html
- a694a55: chore(deps): bump html-rspack-plugin v5.5.5
- 8aa416e: perf: add prebundle scripts and bundle deepmerge
- 6abd810: chore(server): route.json is no longer needed
- 4092858: chore: add prod-server e2e test cases and support not printURLs when preview
- 648e847: perf: prebundle fs-extra and url-join

## 0.0.20

### Patch Changes

- 06e7fce: chore(deps): bump html-rspack-plugin v5.5.4
- a802111: chore: rename hmr path to /rsbuild-hmr
- ae399ab: refactor: move sri plugin to uni-builder
- 0ca7057: perf: integrate html-rspack-plugin to reduce dependencies
- 9ffb36b: refactor(core): merge asset plugins to a single plugin
- 7158af9: refactor: simplify rsbuild dev-related configurations #444
- bdd54f8: refactor: move lazyCompilation plugin to uni-builder
- 1626d73: types: unify plugin hooks type
- 9b33bb7: fix(server): remove useless serverOptions, and fix https urls not print when set https

  fix(server): 移除无用的 serverOptions 配置，并修复 https url 打印错误

- 0b1171b: refactor: move disableInlineRuntimeChunk to uni-builder

## 0.0.19

### Patch Changes

- f47302e: chore: update stats chunk type

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
