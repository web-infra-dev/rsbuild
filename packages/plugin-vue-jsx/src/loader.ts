import type { LoaderContext } from '@rspack/core';
import * as babel from '@babel/core';
import type { types } from '@babel/core';
import jsx from '@vue/babel-plugin-jsx';
import { createHash } from 'node:crypto';

export default function (this: LoaderContext<unknown>, source: string) {
  const loaderContext = this;
  this?.cacheable(true);

  if (!(loaderContext.mode === 'development')) {
    return source;
  }

  const id = loaderContext.resourcePath;
  const babelOptions = loaderContext.getOptions();

  const result = babel.transformSync(source, {
    babelrc: false,
    ast: true,
    plugins: [[jsx, babelOptions]],
    sourceMaps: true,
    sourceFileName: id,
  })!;

  interface HotComponent {
    local: string;
    id: string;
  }

  const declaredComponents: string[] = [];
  const hotComponents: HotComponent[] = [];
  let hasDefault = false;

  for (const node of result.ast!.program.body) {
    if (node.type === 'VariableDeclaration') {
      /*
      match:
        const A = defineComponent(() => {})
        const B = defineComponent(() => {})
       */
      const names = parseComponentDecls(node);
      if (names.length) {
        declaredComponents.push(...names);
      }
    }

    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration && node.declaration.type === 'VariableDeclaration') {
        /*
        match:
          export const A = defineComponent(() => {})
          export const B = defineComponent(() => {})
         */
        hotComponents.push(
          ...parseComponentDecls(node.declaration).map((name) => ({
            local: name,
            id: getHash(id + name),
          })),
        );
      } else if (node.specifiers.length) {
        /*
        match:
          const A = defineComponent(() => {})
          const B = defineComponent(() => {})
          export { A, B }
         */
        for (const spec of node.specifiers) {
          if (
            spec.type === 'ExportSpecifier' &&
            spec.exported.type === 'Identifier'
          ) {
            const matched = declaredComponents.find(
              (name) => name === spec.local.name,
            );
            if (matched) {
              hotComponents.push({
                local: spec.local.name,
                id: getHash(id + spec.exported.name),
              });
            }
          }
        }
      }
    }

    if (node.type === 'ExportDefaultDeclaration') {
      if (node.declaration.type === 'Identifier') {
        /*
        match:
         const Default = defineComponent(() => {})
         export default Default
         */
        const _name = node.declaration.name;
        const matched = declaredComponents.find((name) => name === _name);
        if (matched) {
          hotComponents.push({
            local: _name,
            id: getHash(id + 'default'),
          });
        }
      } else if (isDefineComponentCall(node.declaration)) {
        /*
        match:
          export default defineComponent(() => {})
         */
        hasDefault = true;
        hotComponents.push({
          local: '__default__',
          id: getHash(id + 'default'),
        });
      }
    }
  }

  if (hotComponents.length) {
    if (hasDefault) {
      result.code =
        result.code!.replace(
          /export default defineComponent/g,
          `const __default__ = defineComponent`,
        ) + `\nexport default __default__`;
    }
  }

  let code = result.code;
  let callbackCode = ``;
  for (const { local, id } of hotComponents) {
    code +=
      `\n${local}.__hmrId = "${id}"` +
      `\n__VUE_HMR_RUNTIME__.createRecord("${id}", ${local})`;
    callbackCode += `\n__VUE_HMR_RUNTIME__.reload("${id}", ${local})`;
  }

  code +=
    `\n/* hot reload */` +
    `\nif (module.hot) {` +
    `\n  module.hot.accept()` +
    `\n  ${callbackCode}` +
    `\n}`;

  return code;
}

function parseComponentDecls(node: types.VariableDeclaration) {
  const names = [];
  for (const decl of node.declarations) {
    if (decl.id.type === 'Identifier' && isDefineComponentCall(decl.init)) {
      names.push(decl.id.name);
    }
  }
  return names;
}

function isDefineComponentCall(node?: types.Node | null) {
  return (
    node &&
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'defineComponent'
  );
}

function getHash(text: string) {
  return createHash('sha256').update(text).digest('hex').substring(0, 8);
}
