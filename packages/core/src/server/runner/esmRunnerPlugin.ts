import type { ModuleExportName, Node, Program } from '@swc-next/core';
import { analyze } from 'eslint-scope';
import MagicString from 'magic-string';

const exportName = (node: ModuleExportName): string =>
  node.type === 'Identifier' ? node.name : node.value;

const walk = (
  node: Node,
  visit: (node: Node, parent?: Node) => void,
  parent?: Node,
): void => {
  visit(node, parent);
  for (const value of Object.values(node)) {
    const children = Array.isArray(value) ? value : [value];
    for (const child of children) {
      if (child && typeof child === 'object' && 'type' in child) {
        walk(child as Node, visit, node);
      }
    }
  }
};

export type EsmRunnerPluginResult = {
  code: string;
  map: string;
  parameters: string[];
};

/**
 * Lower SWC Next's ESTree AST to the runner protocol. Edit the original source
 * because SWC Next's printer does not yet generate source maps.
 */
export const esmRunnerPlugin = (
  program: Program,
  source: string,
  filename: string,
): EsmRunnerPluginResult => {
  const output = new MagicString(source);
  const parents = new Map<Node, Node>();
  const identifiers = new Set<string>();
  walk(program, (node, parent) => {
    // eslint-scope uses ranges to distinguish function parameters from bodies.
    Object.assign(node, { range: [node.start, node.end] });
    if (parent) {
      parents.set(node, parent);
    }
    if (node.type === 'Identifier') {
      identifiers.add(node.name);
    }
  });
  let index = 0;
  const uniqueName = (prefix: string): string => {
    let name = prefix;
    while (identifiers.has(name)) {
      name = `${prefix}${index++}`;
    }
    identifiers.add(name);
    return name;
  };
  // Parameters are selected per module, so user bindings cannot capture helpers.
  const parameters = [
    '__rsbuild_import__',
    '__rsbuild_dynamic_import__',
    '__rsbuild_exports__',
    '__rsbuild_export_all__',
    '__rsbuild_export_name__',
    '__rsbuild_import_meta__',
  ].map(uniqueName);
  const [importHelper, dynamicImport, , exportAll, registerExport, importMeta] =
    parameters;

  // Only JavaScript is parsed. SWC Next also exposes TS node types, whereas
  // eslint-scope's types describe the JavaScript ESTree subset.
  const scopes = analyze(program as unknown as Parameters<typeof analyze>[0], {
    ecmaVersion: 2022,
    sourceType: 'module',
    optimistic: true,
    ignoreEval: true,
  });
  const moduleScope = scopes.scopes.find((scope) => scope.type === 'module')!;
  const imports = new Map<string, string>();
  const registrations: string[] = [];
  const requests: string[] = [];
  const importNamespaces = new Map<Node, string>();
  const register = (name: string, value: string): void => {
    registrations.push(
      `${registerExport}(${JSON.stringify(name)}, () => ${value});`,
    );
  };
  const request = (specifier: string, names: string[]): string => {
    const namespace = uniqueName('__rsbuild_import_namespace__');
    const metadata = names.length
      ? `, { importedNames: ${JSON.stringify(names)} }`
      : '';
    requests.push(
      `const ${namespace} = await ${importHelper}(${JSON.stringify(specifier)}${metadata});`,
    );
    return namespace;
  };
  const member = (namespace: string, name: string): string =>
    `${namespace}[${JSON.stringify(name)}]`;
  const remove = (node: Node): void => {
    // Keep a statement boundary when the preceding statement relied on ASI.
    output.overwrite(node.start, node.end, ';');
  };

  // Collect imports first: local exports can precede their import declarations.
  for (const node of program.body) {
    if (
      (node.type === 'ImportDeclaration' ||
        node.type === 'ExportNamedDeclaration' ||
        node.type === 'ExportAllDeclaration') &&
      node.attributes.length
    ) {
      throw new Error('Import attributes are not supported');
    }
    if (node.type === 'ImportDeclaration' && node.phase) {
      throw new Error('Import source/defer phases are not supported');
    }
    if (node.type !== 'ImportDeclaration') {
      continue;
    }
    // Reserve the namespace now, but emit requests in module source order below.
    const namespace = uniqueName('__rsbuild_import_namespace__');
    for (const specifier of node.specifiers) {
      imports.set(
        specifier.local.name,
        specifier.type === 'ImportNamespaceSpecifier'
          ? namespace
          : member(
              namespace,
              specifier.type === 'ImportDefaultSpecifier'
                ? 'default'
                : exportName(specifier.imported),
            ),
      );
    }
    // The namespace name is stored separately for side-effect-only imports.
    importNamespaces.set(node, namespace);
  }

  for (const node of program.body) {
    switch (node.type) {
      case 'ImportDeclaration': {
        const names = node.specifiers.flatMap((specifier) =>
          specifier.type === 'ImportNamespaceSpecifier'
            ? []
            : [
                specifier.type === 'ImportDefaultSpecifier'
                  ? 'default'
                  : exportName(specifier.imported),
              ],
        );
        const metadata = names.length
          ? `, { importedNames: ${JSON.stringify(names)} }`
          : '';
        requests.push(
          `const ${importNamespaces.get(node)} = await ${importHelper}(${JSON.stringify(node.source.value)}${metadata});`,
        );
        remove(node);
        break;
      }
      case 'ExportNamedDeclaration': {
        if (node.declaration) {
          const declaration = node.declaration;
          const variables = scopes.getDeclaredVariables(
            declaration as unknown as Parameters<
              typeof scopes.getDeclaredVariables
            >[0],
          );
          for (const variable of variables) {
            // Function declarations also report their parameter bindings.
            if (variable.scope === moduleScope) {
              register(variable.name, variable.name);
            }
          }
          output.remove(node.start, declaration.start);
        } else {
          const namespace = node.source
            ? request(
                node.source.value,
                node.specifiers.map((specifier) => exportName(specifier.local)),
              )
            : undefined;
          for (const specifier of node.specifiers) {
            const local = exportName(specifier.local);
            register(
              exportName(specifier.exported),
              namespace
                ? member(namespace, local)
                : (imports.get(local) ?? local),
            );
          }
          remove(node);
        }
        break;
      }
      case 'ExportAllDeclaration': {
        const namespace = request(node.source.value, []);
        if (node.exported) {
          register(exportName(node.exported), namespace);
        } else {
          requests.push(`${exportAll}(${namespace});`);
        }
        remove(node);
        break;
      }
      case 'ExportDefaultDeclaration': {
        const declaration = node.declaration;
        const isDeclaration =
          declaration.type === 'FunctionDeclaration' ||
          declaration.type === 'ClassDeclaration';
        if (isDeclaration && declaration.id) {
          register('default', declaration.id.name);
          output.remove(node.start, declaration.start);
        } else {
          const name = uniqueName('__rsbuild_default__');
          register('default', name);
          if (declaration.type === 'FunctionDeclaration') {
            // Anonymous default functions are hoisted, including in cycles.
            // Skip comments when locating their parameter-list opening token.
            const header = source.slice(
              declaration.start,
              declaration.body.start,
            );
            const tokens = /\/\*[\s\S]*?\*\/|\/\/[^\r\n]*|\(/g;
            let token: RegExpExecArray | null;
            while ((token = tokens.exec(header)) && token[0] !== '(') {
              // Skip comments before the parameter list.
            }
            if (!token) {
              throw new Error('Could not locate default function parameters');
            }
            output.remove(node.start, declaration.start);
            output.appendLeft(declaration.start + token.index, ` ${name}`);
          } else {
            // With preserveParens disabled the expression span excludes its
            // surrounding parentheses. Replace only the export keywords.
            const prefix =
              /^export(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\r\n]*)+default\b/.exec(
                source.slice(node.start, declaration.start),
              )!;
            output.overwrite(
              node.start,
              node.start + prefix[0].length,
              `const ${name} =`,
            );
            // Terminate expressions even when the original export relied on ASI.
            output.appendLeft(node.end, ';');
          }
        }
        break;
      }
    }
  }

  for (const [name, replacement] of imports) {
    const variable = moduleScope.set.get(name)!;
    for (const reference of variable.references) {
      const id = reference.identifier as unknown as Node;
      const parent = parents.get(id);
      if (parent?.type === 'ExportSpecifier') {
        continue;
      }
      if (reference.isWrite()) {
        throw new SyntaxError(`Cannot assign to import '${name}'`);
      }
      const unbound =
        (parent?.type === 'CallExpression' && parent.callee === id) ||
        (parent?.type === 'TaggedTemplateExpression' && parent.tag === id);
      const value = unbound ? `(0, ${replacement})` : replacement;
      const shorthand = parent?.type === 'Property' && parent.shorthand;
      output.overwrite(
        id.start,
        id.end,
        shorthand ? `${name}: ${value}` : value,
      );
    }
  }

  walk(program, (node) => {
    if (node.type === 'ImportExpression') {
      if (node.phase) {
        throw new Error('Dynamic import source/defer phases are not supported');
      }
      output.overwrite(node.start, node.start + 'import'.length, dynamicImport);
    } else if (node.type === 'MetaProperty' && node.meta.name === 'import') {
      output.overwrite(node.start, node.end, importMeta);
    }
  });
  if (program.hashbang) {
    output.remove(program.hashbang.start, program.hashbang.end);
  }
  output.prepend(`${[...registrations, ...requests].join('\n')}\n`);
  return {
    code: output.toString(),
    map: output
      .generateMap({ source: filename, includeContent: true, hires: true })
      .toString(),
    parameters,
  };
};
