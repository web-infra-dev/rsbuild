import { createHash } from 'node:crypto';
import jsx from '@vue/babel-plugin-jsx';
import * as babelCore from '@babel/core';

interface BabelPluginOptions {
  types: typeof babelCore.types;
}

interface HotComponent {
  local: string;
  id: string;
}

export default function vueJsxHmrPlugin({
  types: t,
}: BabelPluginOptions): babelCore.PluginObj {
  console.log('vueJsxHmrPlugin');
  let declaredComponents: string[] = [];
  let hotComponents: HotComponent[] = [];
  let hasDefault = false;

  const visitor: babelCore.Visitor = {
    VariableDeclaration(
      path: babelCore.NodePath<babelCore.types.VariableDeclaration>,
    ) {
      console.log('VariableDeclaration', (path.hub as any).file.opts.filename);
      const names = parseComponentDecls(path.node);
      if (names.length) {
        declaredComponents.push(...names);
      }
    },

    ExportNamedDeclaration(
      path: babelCore.NodePath<babelCore.types.ExportNamedDeclaration>,
    ) {
      console.log(
        'ExportNamedDeclaration',
        (path.hub as any).file.opts.filename,
      );
      if (
        path.node.declaration &&
        path.node.declaration.type === 'VariableDeclaration'
      ) {
        hotComponents.push(
          ...parseComponentDecls(path.node.declaration).map((name) => ({
            local: name,
            id: getHash((path.hub as any).file.opts.filename + name),
          })),
        );
      } else if (path.node.specifiers.length) {
        for (const spec of path.node.specifiers) {
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
                id: getHash(
                  (path.hub as any).file.opts.filename + spec.exported.name,
                ),
              });
            }
          }
        }
      }
    },

    ExportDefaultDeclaration(
      path: babelCore.NodePath<babelCore.types.ExportDefaultDeclaration>,
    ) {
      console.log(
        'ExportDefaultDeclaration',
        (path.hub as any).file.opts.filename,
      );
      if (path.node.declaration.type === 'Identifier') {
        const _name = path.node.declaration.name;
        const matched = declaredComponents.find((name) => name === _name);
        if (matched) {
          hotComponents.push({
            local: _name,
            id: getHash((path.hub as any).file.opts.filename + 'default'),
          });
        }
      } else if (isDefineComponentCall(path.node.declaration)) {
        hasDefault = true;
        hotComponents.push({
          local: '__default__',
          id: getHash((path.hub as any).file.opts.filename + 'default'),
        });
      }
    },
  };

  return {
    inherits: jsx,
    visitor,
    post(this, file) {
      // console.dir(file, { depth: null });
      console.log('post');
      // console.dir(this)
      // console.dir(file)
      console.log('hotComponents', hotComponents);

      if (hotComponents.length) {
        const code: babelCore.types.Statement[] = [];
        const callbackCode: babelCore.types.Statement[] = [];

        for (const { local, id } of hotComponents) {
          code.push(
            t.expressionStatement(
              t.assignmentExpression(
                '=',
                t.memberExpression(
                  t.identifier(local),
                  t.identifier('__hmrId'),
                ),
                t.stringLiteral(id),
              ),
            ),
            t.expressionStatement(
              t.callExpression(
                t.memberExpression(
                  t.identifier('__VUE_HMR_RUNTIME__'),
                  t.identifier('createRecord'),
                ),
                [t.stringLiteral(id), t.identifier(local)],
              ),
            ),
          );
          callbackCode.push(
            t.expressionStatement(
              t.callExpression(
                t.memberExpression(
                  t.identifier('__VUE_HMR_RUNTIME__'),
                  t.identifier('reload'),
                ),
                [t.stringLiteral(id), t.identifier(local)],
              ),
            ),
          );
        }

        const programPath = file.path;
        if (hasDefault) {
          programPath.traverse({
            ExportDefaultDeclaration(
              path: babelCore.NodePath<babelCore.types.ExportDefaultDeclaration>,
            ) {
              console.log(
                'ExportDefaultDeclaration',
                path.node.declaration.type,
              );
              if (
                path.node.declaration.type === 'CallExpression' &&
                t.isIdentifier(path.node.declaration.callee) &&
                path.node.declaration.callee.name === 'defineComponent'
              ) {
                const defaultDecl = t.variableDeclaration('const', [
                  t.variableDeclarator(
                    t.identifier('__default__'),
                    path.node.declaration,
                  ),
                ]);

                path.replaceWith(defaultDecl);

                programPath.pushContainer('body', [
                  t.exportDefaultDeclaration(t.identifier('__default__')),
                ]);
              }
            },
          });
        }

        const hotReloadCode: babelCore.types.Statement[] = [
          ...code,
          t.expressionStatement(t.stringLiteral('/* hot reload */')),
          t.ifStatement(
            t.memberExpression(t.identifier('module'), t.identifier('hot')),
            t.blockStatement([
              t.expressionStatement(
                t.callExpression(
                  t.memberExpression(
                    t.memberExpression(
                      t.identifier('module'),
                      t.identifier('hot'),
                    ),
                    t.identifier('accept'),
                  ),
                  [],
                ),
              ),
              ...callbackCode,
            ]),
          ),
        ];

        programPath.pushContainer('body', hotReloadCode);
        // hotComponents = [];
      }
    },
  };
}

function parseComponentDecls(
  node: babelCore.types.VariableDeclaration,
): string[] {
  const names: string[] = [];
  for (const decl of node.declarations) {
    if (decl.id.type === 'Identifier' && isDefineComponentCall(decl.init)) {
      names.push(decl.id.name);
    }
  }
  return names;
}

function isDefineComponentCall(node?: babelCore.types.Node | null): boolean {
  return !!(
    node &&
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'defineComponent'
  );
}

function getHash(text: string): string {
  return createHash('sha256').update(text).digest('hex').substring(0, 8);
}
