# @rsbuild/webpack

## 0.0.24

### Patch Changes

- e8c252f: fix: context should be updated after modifyRsbuildConfig hook
- Updated dependencies [86e7b25]
- Updated dependencies [289dc9a]
- Updated dependencies [e8c252f]
- Updated dependencies [53f8b52]
- Updated dependencies [f5b397b]
- Updated dependencies [ed966e0]
  - @rsbuild/shared@0.0.24
  - @rsbuild/core@0.0.24
  - @rsbuild/babel-preset@0.0.24
  - @rsbuild/plugin-babel@0.0.24
  - @rsbuild/plugin-css-minimizer@0.0.24

## 0.0.23

### Patch Changes

- 8d884d7: refactor: always use source.entries to set entry
- 0dbf692: refactor: rename source.entries to source.entry
- Updated dependencies [e612b120]
- Updated dependencies [0aa061d]
- Updated dependencies [2f124f6d]
- Updated dependencies [8d884d7]
- Updated dependencies [725941dd]
- Updated dependencies [0dbf692]
- Updated dependencies [254b220]
- Updated dependencies [d796953]
  - @rsbuild/core@0.0.23
  - @rsbuild/shared@0.0.23
  - @rsbuild/plugin-babel@0.0.23
  - @rsbuild/plugin-css-minimizer@0.0.23
  - @rsbuild/babel-preset@0.0.23

## 0.0.22

### Patch Changes

- 1151c677: refactor: extract rem as a standalone plugin
- 190b8c2: feat: always compile TS and JSX files
- Updated dependencies [a82f18c]
- Updated dependencies [64e1913a]
- Updated dependencies [34255e7]
- Updated dependencies [1151c677]
- Updated dependencies [6df00856]
- Updated dependencies [85134ea]
- Updated dependencies [7aeebf41]
- Updated dependencies [f0f0627]
- Updated dependencies [190b8c2]
  - @rsbuild/core@0.0.22
  - @rsbuild/shared@0.0.22
  - @rsbuild/plugin-babel@0.0.22
  - @rsbuild/plugin-css-minimizer@0.0.22
  - @rsbuild/babel-preset@0.0.22

## 0.0.21

### Patch Changes

- 42ace29: chore: using exports.types to replace typesVersion
- a694a55: chore(deps): bump html-rspack-plugin v5.5.5
- 4092858: chore: add prod-server e2e test cases and support not printURLs when preview
- 648e847: perf: prebundle fs-extra and url-join
- Updated dependencies [42ace29]
- Updated dependencies [c90bebe]
- Updated dependencies [a919119]
- Updated dependencies [0270c27]
- Updated dependencies [a58e71c]
- Updated dependencies [dbdc3c5]
- Updated dependencies [d691901]
- Updated dependencies [a694a55]
- Updated dependencies [8aa416e]
- Updated dependencies [69262e9]
- Updated dependencies [6abd810]
- Updated dependencies [4092858]
- Updated dependencies [648e847]
  - @rsbuild/babel-preset@0.0.21
  - @rsbuild/shared@0.0.21
  - @rsbuild/core@0.0.21
  - @rsbuild/plugin-babel@0.0.21
  - @rsbuild/plugin-css-minimizer@0.0.21

## 0.0.20

### Patch Changes

- 06e7fce: chore(deps): bump html-rspack-plugin v5.5.4
- ae399ab: refactor: move sri plugin to uni-builder
- 0ca7057: perf: integrate html-rspack-plugin to reduce dependencies
- 9ffb36b: refactor(core): merge asset plugins to a single plugin
- 97edf56: fix(webpack): add missing dependencies for compiled packages
- bdd54f8: refactor: move lazyCompilation plugin to uni-builder
- 1626d73: types: unify plugin hooks type
- 16a0ee2: feat(plugin-react): split react-refresh to lib-react.js
- 0b1171b: refactor: move disableInlineRuntimeChunk to uni-builder
- Updated dependencies [06e7fce]
- Updated dependencies [a802111]
- Updated dependencies [ae399ab]
- Updated dependencies [0ca7057]
- Updated dependencies [9ffb36b]
- Updated dependencies [3c4e511]
- Updated dependencies [7158af9]
- Updated dependencies [b55d867]
- Updated dependencies [d5eaaf6]
- Updated dependencies [bdd54f8]
- Updated dependencies [1626d73]
- Updated dependencies [73780a8]
- Updated dependencies [9b33bb7]
- Updated dependencies [0b1171b]
  - @rsbuild/shared@0.0.20
  - @rsbuild/core@0.0.20
  - @rsbuild/babel-preset@0.0.20
  - @rsbuild/plugin-babel@0.0.20
  - @rsbuild/plugin-css-minimizer@0.0.20

## 0.0.19

### Patch Changes

- Updated dependencies [f47302e]
- Updated dependencies [5e13847]
  - @rsbuild/shared@0.0.19
  - @rsbuild/core@0.0.19
  - @rsbuild/babel-preset@0.0.19
  - @rsbuild/plugin-babel@0.0.19
  - @rsbuild/plugin-css-minimizer@0.0.19

## 0.0.18

### Patch Changes

- 164f135: refactor: extract assetsRetry as a standalone plugin
- 4887d6d: chore: use findUp utils to replace pkg-up dep
- c743a94: refactor: move source.moduleScopes to uni-builder
- a2bd530: fix(webpack): disable webpack performance hints
- 594c16a: feat: only enable progress bar in production
- 78d4d94: feat: replace pretty-time and improve time format
- Updated dependencies [6f1c4a1]
- Updated dependencies [164f135]
- Updated dependencies [efcc697]
- Updated dependencies [96d9d43]
- Updated dependencies [4887d6d]
- Updated dependencies [c743a94]
- Updated dependencies [faf797a]
- Updated dependencies [58306e2]
- Updated dependencies [594c16a]
- Updated dependencies [7fe5f26]
- Updated dependencies [c3201ae]
- Updated dependencies [78d4d94]
- Updated dependencies [fad683d]
  - @rsbuild/core@0.0.18
  - @rsbuild/shared@0.0.18
  - @rsbuild/plugin-babel@0.0.18
  - @rsbuild/plugin-css-minimizer@0.0.18
  - @rsbuild/babel-preset@0.0.18

## 0.0.17

### Patch Changes

- b25b47c: feat: support html.template as a function
- fd05681: refactor: remove source.compileJsDataURI option
- 6220e04: refactor: merge HTML plugins into a unified plugin
- 58e7453: feat: support html.favicon as a function
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
  - @rsbuild/core@0.0.17
  - @rsbuild/babel-preset@0.0.17
  - @rsbuild/plugin-babel@0.0.17
  - @rsbuild/plugin-css-minimizer@0.0.17

## 0.0.16

### Patch Changes

- Updated dependencies [a2a18ec]
- Updated dependencies [8f03dd0]
- Updated dependencies [9a52542]
  - @rsbuild/shared@0.0.16
  - @rsbuild/core@0.0.16
  - @rsbuild/babel-preset@0.0.16
  - @rsbuild/plugin-babel@0.0.16
  - @rsbuild/plugin-css-minimizer@0.0.16

## 0.0.15

### Patch Changes

- Updated dependencies [25ab68e]
  - @rsbuild/shared@0.0.15
  - @rsbuild/core@0.0.15
  - @rsbuild/babel-preset@0.0.15
  - @rsbuild/plugin-babel@0.0.15
  - @rsbuild/plugin-css-minimizer@0.0.15

## 0.0.14

### Patch Changes

- 705c6a7: refactor: move legacy manifest config to uni-builder
- a4badc6: perf: using a lighter modern.js server package
- 8f52317: perf: replace chalk with picocolors
- Updated dependencies [705c6a7]
- Updated dependencies [a4badc6]
- Updated dependencies [8f52317]
- Updated dependencies [0316dd1]
- Updated dependencies [094cd55]
- Updated dependencies [c331840]
  - @rsbuild/shared@0.0.14
  - @rsbuild/core@0.0.14
  - @rsbuild/plugin-css-minimizer@0.0.14
  - @rsbuild/babel-preset@0.0.14
  - @rsbuild/plugin-babel@0.0.14

## 0.0.13

### Patch Changes

- 9c19198: refactor: simplify RsbuildConfig definitions
- b46bc69: refactor: replace @rspack/html-plugin with html-webpack-plugin
- 3bf93a5: refactor: extract css-minimizer plugin as a standalone package
- 84a4d61: chore(utils): unify the castArray implementation
- 510de48: perf: switch the default polyfill mode to usage
- 73ec291: perf: remove config validation
- Updated dependencies [9c19198]
- Updated dependencies [fedbe79]
- Updated dependencies [219dd60]
- Updated dependencies [dbceb3e]
- Updated dependencies [b46bc69]
- Updated dependencies [7ddb447]
- Updated dependencies [3bf93a5]
- Updated dependencies [84a4d61]
- Updated dependencies [510de48]
- Updated dependencies [73ec291]
  - @rsbuild/shared@0.0.13
  - @rsbuild/core@0.0.13
  - @rsbuild/plugin-css-minimizer@0.0.13
  - @rsbuild/plugin-babel@0.0.13
  - @rsbuild/babel-preset@0.0.13

## 0.0.12

### Patch Changes

- @rsbuild/babel-preset@0.0.12
- @rsbuild/core@0.0.12
- @rsbuild/plugin-babel@0.0.12
- @rsbuild/shared@0.0.12

## 0.0.9

### Patch Changes

- @rsbuild/babel-preset@0.0.9
- @rsbuild/core@0.0.9
- @rsbuild/shared@0.0.9

## 0.0.8

### Patch Changes

- af1da01: chore: remove modern-web target
- 0fe1acb: feat(rsbuild/webpack): init
- 349df6f: feat: adjust the default browserslist config
- Updated dependencies [90cf710]
- Updated dependencies [d6755bf]
- Updated dependencies [af1da01]
- Updated dependencies [b1a1327]
- Updated dependencies [290427a]
- Updated dependencies [ce80b80]
- Updated dependencies [3936afc]
- Updated dependencies [349df6f]
- Updated dependencies [d57dcec]
  - @rsbuild/shared@0.0.8
  - @rsbuild/core@0.0.8
  - @rsbuild/babel-preset@0.0.8
