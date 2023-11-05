import * as SDK from '@rsbuild/doctor-sdk/graph';
import { isNumber } from 'lodash';
import { parser, Node } from '@rsbuild/doctor-utils/ruleUtils';

function getDefaultExportIdentifier(
  node: Node.ExportDefaultDeclaration,
  module: SDK.Module,
  searchId: boolean,
): SDK.Statement | undefined {
  const { declaration } = node;

  if (parser.asserts.isLiteral(declaration) && declaration.loc) {
    return module.getStatement(declaration.loc);
  }

  if (parser.asserts.isIdentifier(declaration)) {
    if (searchId) {
      const result = getDeclarationIdentifier(declaration.name, module);

      if (result) {
        return result;
      }
    } else if (declaration.loc) {
      return module.getStatement(declaration.loc);
    }
  }

  if (
    parser.asserts.isClassDeclaration(declaration) ||
    parser.asserts.isFunctionDeclaration(declaration)
  ) {
    if (declaration.id?.loc) {
      return module.getStatement(declaration.id.loc);
    }
  }

  // Take the first line by default.
  const startLine = node.declaration.loc?.start.line;

  if (!isNumber(startLine)) {
    return;
  }

  const { transformed } = module.getSource();
  const endColumn = transformed.split('\n')[startLine - 1].length - 1;

  return module.getStatement({
    start: {
      line: startLine,
      column: 0,
    },
    end: {
      line: startLine,
      column: endColumn,
    },
  });
}

export function getExportIdentifierStatement(name: string, module: SDK.Module) {
  const ast = module.getProgram();

  if (!ast) {
    return;
  }

  for (const node of ast.body) {
    // By default, the entire export statement is returned when exporting.
    if (parser.asserts.isExportDefaultDeclaration(node)) {
      const result = getDefaultExportIdentifier(node, module, false);

      if (result) {
        return result;
      }
    }

    const id = parser.utils.getIdentifierInExport(name, node);

    if (id?.loc) {
      return module.getStatement(id.loc);
    }
  }
}

export function getDeclarationIdentifier(name: string, module: SDK.Module) {
  const ast = module.getProgram();

  if (!ast) {
    return;
  }

  for (const node of ast.body) {
    const id = parser.utils.getIdentifierInDeclaration(name, node);

    if (id?.loc) {
      return module.getStatement(id.loc);
    }

    if (parser.asserts.isExportNamedDeclaration(node) && node.declaration) {
      const id = parser.utils.getIdentifierInDeclaration(
        name,
        node.declaration,
      );

      if (id?.loc) {
        return module.getStatement(id.loc);
      }
    }

    if (name === 'default' && parser.asserts.isExportDefaultDeclaration(node)) {
      const result = getDefaultExportIdentifier(node, module, true);

      if (result) {
        return result;
      }
    }
  }
}
