# @rsbuild/core

## 0.0.24

### Patch Changes

- 289dc9a: fix: should not print entry error when entry is set by plugins
- e8c252f: fix: context should be updated after modifyRsbuildConfig hook
- 53f8b52: fix: should register config.plugins when using JavaScript API
- f5b397b: feat: handle errors when CLI command failed
- ed966e0: fix(deps): bump Rspack 0.3.13 to fix new Class error
- Updated dependencies [86e7b25]
- Updated dependencies [289dc9a]
- Updated dependencies [e8c252f]
- Updated dependencies [53f8b52]
- Updated dependencies [f5b397b]
- Updated dependencies [ed966e0]
  - @rsbuild/shared@0.0.24

## 0.0.23

### Patch Changes

- e612b120: fix(server): compiler closed delay when calling server.close
- 0aa061d: hotfix: can't get rspack util in tools.rspack
- 2f124f6d: perf: prebundle gzip-size, rslog and more
- 8d884d7: refactor: always use source.entries to set entry
- 725941dd: perf: lazy load prodServer module
- 0dbf692: refactor: rename source.entries to source.entry
- 254b220: feat: support use index.cjs or index.mjs as the default entry
- d796953: types: fix RsbuildPlugin do not provide API type by default
- Updated dependencies [2f124f6d]
- Updated dependencies [8d884d7]
- Updated dependencies [0dbf692]
- Updated dependencies [254b220]
  - @rsbuild/shared@0.0.23

## 0.0.22

### Patch Changes

- a82f18c: chore(type): update server.close as an async function
- 64e1913a: perf(deps): prebundle connect and open
- 1151c677: refactor: extract rem as a standalone plugin
- 6df00856: chore: compile hmr-client as es5
- 85134ea: chore(server): adjust printURLs, httpServer and dev compile execution order
- 7aeebf41: refactor: move disableCssModuleExtension config to uni-builder
- f0f0627: feat(deps): bump Rspack v0.3.12
- 190b8c2: feat: always compile TS and JSX files
- Updated dependencies [64e1913a]
- Updated dependencies [34255e7]
- Updated dependencies [1151c677]
- Updated dependencies [7aeebf41]
- Updated dependencies [f0f0627]
- Updated dependencies [190b8c2]
  - @rsbuild/shared@0.0.22

## 0.0.21

### Patch Changes

- 42ace29: chore: using exports.types to replace typesVersion
- a919119: chore(core): remove lodash dependency
- 0270c27: feat(cli): restart dev server when config file changed
- dbdc3c5: hotfix(server): should print url with distPath.html
- d691901: perf(core): remove strip-ansi dependency
- a694a55: chore(deps): bump html-rspack-plugin v5.5.5
- 8aa416e: perf: add prebundle scripts and bundle deepmerge
- 69262e9: perf(core): remove filesize dependency
- 6abd810: chore(server): route.json is no longer needed
- 4092858: chore: add prod-server e2e test cases and support not printURLs when preview
- 648e847: perf: prebundle fs-extra and url-join
- Updated dependencies [42ace29]
- Updated dependencies [c90bebe]
- Updated dependencies [a919119]
- Updated dependencies [0270c27]
- Updated dependencies [a58e71c]
- Updated dependencies [dbdc3c5]
- Updated dependencies [a694a55]
- Updated dependencies [8aa416e]
- Updated dependencies [6abd810]
- Updated dependencies [4092858]
- Updated dependencies [648e847]
  - @rsbuild/shared@0.0.21

## 0.0.20

### Patch Changes

- 06e7fce: chore(deps): bump html-rspack-plugin v5.5.4
- a802111: chore: rename hmr path to /rsbuild-hmr
- 0ca7057: perf: integrate html-rspack-plugin to reduce dependencies
- 9ffb36b: refactor(core): merge asset plugins to a single plugin
- 3c4e511: hotfix(dev-server): support access page without suffix
- 7158af9: refactor: simplify rsbuild dev-related configurations #444
- b55d867: feat(server): should print urls by html entry
- d5eaaf6: types: provide all static assets types
- 1626d73: types: unify plugin hooks type
- 73780a8: types: add configuration files and simplify queries
- 9b33bb7: fix(server): remove useless serverOptions, and fix https urls not print when set https

  fix(server): 移除无用的 serverOptions 配置，并修复 https url 打印错误

- 0b1171b: refactor: move disableInlineRuntimeChunk to uni-builder
- Updated dependencies [06e7fce]
- Updated dependencies [a802111]
- Updated dependencies [ae399ab]
- Updated dependencies [0ca7057]
- Updated dependencies [9ffb36b]
- Updated dependencies [7158af9]
- Updated dependencies [bdd54f8]
- Updated dependencies [1626d73]
- Updated dependencies [9b33bb7]
- Updated dependencies [0b1171b]
  - @rsbuild/shared@0.0.20

## 0.0.19

### Patch Changes

- 5e13847: fix(core): failed to read NODE_ENV in config file
- Updated dependencies [f47302e]
  - @rsbuild/shared@0.0.19

## 0.0.18

### Patch Changes

- 6f1c4a1: feat: add builtin assets and CSS modules types
- 164f135: refactor: extract assetsRetry as a standalone plugin
- efcc697: feat: support dynamicImportMode.eager and preserveAllComments'
- 4887d6d: chore: use findUp utils to replace pkg-up dep
- faf797a: fix(deps): add missing dependencies to core and shared
- 58306e2: perf: make open browser faster
- 594c16a: feat: only enable progress bar in production
- 7fe5f26: refactor: move source.globalVars option to uni-builder
- c3201ae: feat: add Rsbuild server, decouple with Modern.js server
- 78d4d94: feat: replace pretty-time and improve time format
- fad683d: feat(cli): add new --open option for dev command
- Updated dependencies [164f135]
- Updated dependencies [96d9d43]
- Updated dependencies [4887d6d]
- Updated dependencies [c743a94]
- Updated dependencies [faf797a]
- Updated dependencies [594c16a]
- Updated dependencies [7fe5f26]
- Updated dependencies [78d4d94]
- Updated dependencies [fad683d]
  - @rsbuild/shared@0.0.18

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
- 7ecbc74: feat: support html.inject as a function
- Updated dependencies [b25b47c]
- Updated dependencies [3b87b50]
- Updated dependencies [fd05681]
- Updated dependencies [6220e04]
- Updated dependencies [41a7938]
- Updated dependencies [f1f15cf]
- Updated dependencies [60fc2de]
- Updated dependencies [58e7453]
- Updated dependencies [659a2f5]
- Updated dependencies [7ecbc74]
- Updated dependencies [47078fd]
  - @rsbuild/shared@0.0.17

## 0.0.16

### Patch Changes

- a2a18ec: feat: support html.meta to be a function
- 8f03dd0: refactor: move html.metaByEntries option to uni-builder
- 9a52542: feat: add default meta configs and simplify the templates
- Updated dependencies [a2a18ec]
- Updated dependencies [8f03dd0]
- Updated dependencies [9a52542]
  - @rsbuild/shared@0.0.16

## 0.0.15

### Patch Changes

- 25ab68e: refactor: use plugin to generate titles instead of template params
- Updated dependencies [25ab68e]
  - @rsbuild/shared@0.0.15

## 0.0.14

### Patch Changes

- 705c6a7: refactor: move legacy manifest config to uni-builder
- a4badc6: perf: using a lighter modern.js server package
- 8f52317: perf: replace chalk with picocolors
- 094cd55: refactor: @rsbuild/core no longer depend on webpack
- c331840: refactor: @rsbuild/shared no longer depend on webpack
- Updated dependencies [705c6a7]
- Updated dependencies [a4badc6]
- Updated dependencies [8f52317]
- Updated dependencies [094cd55]
- Updated dependencies [c331840]
  - @rsbuild/shared@0.0.14

## 0.0.13

### Patch Changes

- 9c19198: refactor: simplify RsbuildConfig definitions
- fedbe79: refactor: use plugin to generate meta tags instead of template params
- 219dd60: chore(deps): bump Rspack v0.3.9
- dbceb3e: fix(startUrl): failed to stringify circular error object
- b46bc69: refactor: replace @rspack/html-plugin with html-webpack-plugin
- 7ddb447: fix(core): failed to release static applescript
- 3bf93a5: refactor: extract css-minimizer plugin as a standalone package
- 84a4d61: chore(utils): unify the castArray implementation
- 510de48: perf: switch the default polyfill mode to usage
- 73ec291: perf: remove config validation
- Updated dependencies [9c19198]
- Updated dependencies [fedbe79]
- Updated dependencies [219dd60]
- Updated dependencies [b46bc69]
- Updated dependencies [3bf93a5]
- Updated dependencies [84a4d61]
- Updated dependencies [510de48]
- Updated dependencies [73ec291]
  - @rsbuild/shared@0.0.13

## 0.0.12

### Patch Changes

- @rsbuild/shared@0.0.12

## 0.0.11

### Patch Changes

- 70c39ed: perf: reduce builtin PostCSS plugins
- 18f3997: fix(schema): add missing tools schemas
- 1bb644b: perf(core): remove strip-ansi dependency
- d5ed6d6: refactor: extract checkSyntax plugin as a standalone package
- 884fbb7: refactor: replace @rspack/dev-client with @rspack/plugin-react-refresh
- b07fdba: refactor: move babel helpers to plugin-babel
- Updated dependencies [70c39ed]
- Updated dependencies [18f3997]
- Updated dependencies [d5ed6d6]
- Updated dependencies [b07fdba]
  - @rsbuild/shared@0.0.11

## 0.0.10

### Patch Changes

- @rsbuild/shared@0.0.10

## 0.0.9

### Patch Changes

- @rsbuild/shared@0.0.9

## 0.0.8

### Patch Changes

- d6755bf: feat(rsbuild): init rsbuild pkg
- af1da01: chore: remove modern-web target
- b1a1327: feat: Use Rspack `builtin:swc-loader` instead of Rspack's built-in translation behavior
- 290427a: feat(cli): support rsbuild inspect command
- 3936afc: feat(core): add basic implementation of CLI
- 349df6f: feat: adjust the default browserslist config
- Updated dependencies [90cf710]
- Updated dependencies [af1da01]
- Updated dependencies [ce80b80]
- Updated dependencies [349df6f]
- Updated dependencies [d57dcec]
  - @rsbuild/shared@0.0.8
