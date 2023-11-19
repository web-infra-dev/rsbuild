# @rsbuild/document

## 0.0.26

### Patch Changes

- 47f06ced: feat(cli): support specify config file path

## 0.0.25

### Patch Changes

- 4608604: refactor: move resolveMainFields option to uni-builder

## 0.0.24

### Patch Changes

- 86e7b25: refactor: remove context.srcPath
- f5b397b: feat: handle errors when CLI command failed

## 0.0.23

### Patch Changes

- 8d884d7: refactor: always use source.entries to set entry
- 0dbf692: refactor: rename source.entries to source.entry
- d796953: types: fix RsbuildPlugin do not provide API type by default

## 0.0.22

### Patch Changes

- 7aeebf41: refactor: move disableCssModuleExtension config to uni-builder

## 0.0.21

### Patch Changes

- 2b2ac7f: hotfix(doc): use rspress next version to adapt rsbuild server

## 0.0.20

### Patch Changes

- a802111: chore: rename hmr path to /rsbuild-hmr
- ae399ab: refactor: move sri plugin to uni-builder
- 0ca7057: perf: integrate html-rspack-plugin to reduce dependencies
- bdd54f8: refactor: move lazyCompilation plugin to uni-builder
- 16a0ee2: feat(plugin-react): split react-refresh to lib-react.js
- 0b1171b: refactor: move disableInlineRuntimeChunk to uni-builder

## 0.0.19

## 0.0.18

### Patch Changes

- 4887d6d: chore: use findUp utils to replace pkg-up dep
- 594c16a: feat: only enable progress bar in production
- 7fe5f26: refactor: move source.globalVars option to uni-builder
- fad683d: feat(cli): add new --open option for dev command

## 0.0.17

### Patch Changes

- b25b47c: feat: support html.template as a function
- 3b87b50: refactor: move html.titleByEntries option to uni-builder
- fd05681: refactor: remove source.compileJsDataURI option
- f1f15cf: feat: support html.templateParameters as a function
- 60fc2de: feat: support html.title as a function
- 58e7453: feat: support html.favicon as a function
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
- 200aaba: fix(doc): link error in NextStep component

## 0.0.14

### Patch Changes

- 705c6a7: refactor: move legacy manifest config to uni-builder

## 0.0.13

### Patch Changes

- b46bc69: refactor: replace @rspack/html-plugin with html-webpack-plugin

## 0.0.12

## 0.0.11

### Patch Changes

- 70c39ed: perf: reduce builtin PostCSS plugins

## 0.0.10

## 0.0.9

## 0.0.8

### Patch Changes

- 9f4b6e7: fix homepage of chinese jump to english version
- 290427a: feat(cli): support rsbuild inspect command
- ce80b80: feat: flatten the output html files
- f6b0c20: fix(@rsbuild/document): correct api content about outputStructure
- 349df6f: feat: adjust the default browserslist config
