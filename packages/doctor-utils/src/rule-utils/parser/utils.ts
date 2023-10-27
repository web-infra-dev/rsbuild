import { parse, ecmaVersion } from 'acorn';
import { Node, ECMAVersion } from './types';
import { asserts } from './asserts';

// TODO: so much Ast node type，not complete yet.
/**
 * Is the node semantics the same?
 * @deprecated
 * - Recursively compare whether the content of the node itself is the same
 * - Ignore comments, positions, string symbols (single and double quotation marks)
 * - String templates and string addition will be considered different
 */
export function isSameSemantics(
  node1: Node.SyntaxNode,
  node2: Node.SyntaxNode,
): boolean {
  if (node1.type !== node2.type) {
    return false;
  }

  switch (node1.type) {
    case 'CallExpression': {
      const next = node2 as Node.SimpleCallExpression;
      return (
        node1.arguments.length === next.arguments.length &&
        Boolean(node1.optional) === Boolean(next.optional) &&
        isSameSemantics(node1.callee, next.callee) &&
        node1.arguments.every((node, i) =>
          isSameSemantics(node, next.arguments[i]),
        )
      );
    }
    case 'MemberExpression': {
      const next = node2 as Node.MemberExpression;
      return (
        node1.computed === next.computed &&
        Boolean(node1.optional) === Boolean(next.optional) &&
        isSameSemantics(node1.object, next.object) &&
        isSameSemantics(node1.property, next.property)
      );
    }
    case 'Identifier': {
      return node1.name === (node2 as Node.Identifier).name;
    }
    case 'Literal': {
      if (asserts.isSimpleLiteral(node1) && asserts.isSimpleLiteral(node2)) {
        return node1.value === (node2 as Node.Literal).value;
      }

      return node1.raw === (node2 as Node.Literal).raw;
    }
    case 'ObjectExpression': {
      const next = node2 as Node.ObjectExpression;
      return (
        node1.properties.length === next.properties.length &&
        node1.properties.every((prop, i) =>
          isSameSemantics(prop, next.properties[i]),
        )
      );
    }
    case 'Property': {
      const next = node2 as Node.Property;
      return (
        node1.computed === next.computed &&
        node1.kind === next.kind &&
        node1.method === next.method &&
        isSameSemantics(node1.key, next.key) &&
        isSameSemantics(node1.value, next.value)
      );
    }

    default: {
      throw new Error(`Unknown node type: ${node1.type}`);
    }
  }
}

/**
 * Get all default reference statements
 */
export function getDefaultImports(
  node: Node.Program,
): Node.ImportDeclaration[] {
  return node.body.filter((statement): statement is Node.ImportDeclaration => {
    if (statement.type !== 'ImportDeclaration') {
      return false;
    }

    const specifier = statement?.specifiers?.[0];

    if (specifier?.type === 'ImportDefaultSpecifier') {
      return true;
    }

    return false;
  });
}

/** Get the literal in the text. */
export function getIdentifierInPattern(
  name: string,
  node: Node.Pattern,
): Node.Identifier | undefined {
  if (asserts.isIdentifier(node) && node.name === name) {
    return node;
  }

  if (asserts.isObjectPattern(node)) {
    for (const prop of node.properties) {
      if (asserts.isAssignmentProperty(prop)) {
        return getIdentifierInPattern(name, prop.value);
      }

      if (asserts.isRestElement(prop)) {
        return getIdentifierInPattern(name, prop);
      }
    }
  }

  if (asserts.isArrayPattern(node)) {
    for (const el of node.elements) {
      if (el) {
        const result = getIdentifierInPattern(name, el);

        if (result) {
          return result;
        }
      }
    }
  }

  if (asserts.isRestElement(node)) {
    return getIdentifierInPattern(name, node.argument);
  }

  if (asserts.isAssignmentPattern(node)) {
    return getIdentifierInPattern(name, node.left);
  }
}

/** Get the variable declaration statement identifier. */
export function getIdentifierInDeclaration(
  name: string,
  node: Node.SyntaxNode,
) {
  function getId(node: { id: unknown }) {
    return asserts.isIdentifier(node.id) && node.id.name === name
      ? node.id
      : undefined;
  }

  if (asserts.isFunctionDeclaration(node)) {
    return getId(node);
  }

  if (asserts.isClassDeclaration(node)) {
    return getId(node);
  }

  if (asserts.isVariableDeclaration(node)) {
    return node.declarations.find((item) =>
      getIdentifierInPattern(name, item.id),
    )?.id as Node.Identifier;
  }
}

/** Get the reference declaration statement identifier. */
export function getIdentifierInImport(name: string, node: Node.SyntaxNode) {
  if (asserts.isImportDeclaration(node)) {
    for (const specifier of node.specifiers ?? []) {
      if (specifier.local.name === name) {
        return specifier.local;
      }
    }
  }
}

/** Get the export statement identifier. */
export function getIdentifierInExport(name: string, node: Node.SyntaxNode) {
  if (asserts.isExportNamedDeclaration(node)) {
    if (node.declaration) {
      return getIdentifierInDeclaration(name, node.declaration);
    }

    for (const specifier of node.specifiers ?? []) {
      if (specifier.exported.name === name) {
        return specifier.exported;
      }
    }
  }

  if (asserts.isExportAllDeclaration(node) && node.exported) {
    if (node.exported.name === name) {
      return node.exported;
    }
  }
}

/** Determine that it can be resolved using the specified ECMA version */
export function canParse(code: string, ecmaVersion: ecmaVersion) {
  try {
    parse(code, {
      ecmaVersion,
      sourceType:
        typeof ecmaVersion === 'number' && ecmaVersion <= 5
          ? 'script'
          : 'module',
    });
    return true;
  } catch (err) {
    return false;
  }
}

/** Determine whether it is all ES5 version code. */
export function isES5(code: string) {
  return canParse(code, 5);
}

/** Determine whether it is all ES6 version code. */
export function isES6(code: string) {
  return canParse(code, 6);
}

/** Detect ECMA version. */
export function detectECMAVersion(code: string) {
  if (isES6(code)) {
    if (isES5(code)) return ECMAVersion.ES5;

    return ECMAVersion.ES6;
  }
  return ECMAVersion.ES7P;
}
