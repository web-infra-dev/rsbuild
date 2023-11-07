# @rsbuild/core

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
