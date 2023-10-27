import { isObject } from 'lodash';
import { Node } from './types';

function isSyntaxNode(node: unknown): node is Node.SyntaxNode {
  return isObject(node) && 'type' in node;
}

function assertCreator<T>(type: string) {
  return (node: unknown): node is T => {
    return isSyntaxNode(node) && node.type === type;
  };
}

export const asserts = {
  isProgram: assertCreator<Node.Program>('Program'),
  isEmptyStatement: assertCreator<Node.EmptyStatement>('EmptyStatement'),
  isBlockStatement: assertCreator<Node.BlockStatement>('BlockStatement'),
  isStaticBlock: assertCreator<Node.StaticBlock>('StaticBlock'),
  isExpressionStatement: assertCreator<Node.ExpressionStatement>(
    'ExpressionStatement',
  ),
  isIfStatement: assertCreator<Node.IfStatement>('IfStatement'),
  isLabeledStatement: assertCreator<Node.LabeledStatement>('LabeledStatement'),
  isBreakStatement: assertCreator<Node.BreakStatement>('BreakStatement'),
  isContinueStatement:
    assertCreator<Node.ContinueStatement>('ContinueStatement'),
  isWithStatement: assertCreator<Node.WithStatement>('WithStatement'),
  isSwitchStatement: assertCreator<Node.SwitchStatement>('SwitchStatement'),
  isReturnStatement: assertCreator<Node.ReturnStatement>('ReturnStatement'),
  isThrowStatement: assertCreator<Node.ThrowStatement>('ThrowStatement'),
  isTryStatement: assertCreator<Node.TryStatement>('TryStatement'),
  isWhileStatement: assertCreator<Node.WhileStatement>('WhileStatement'),
  isDoWhileStatement: assertCreator<Node.DoWhileStatement>('DoWhileStatement'),
  isForStatement: assertCreator<Node.ForStatement>('ForStatement'),
  isForInStatement: assertCreator<Node.ForInStatement>('ForInStatement'),
  isForOfStatement: assertCreator<Node.ForOfStatement>('ForOfStatement'),
  isDebuggerStatement:
    assertCreator<Node.DebuggerStatement>('DebuggerStatement'),
  isFunctionDeclaration: assertCreator<Node.FunctionDeclaration>(
    'FunctionDeclaration',
  ),
  isVariableDeclaration: assertCreator<Node.VariableDeclaration>(
    'VariableDeclaration',
  ),
  isVariableDeclarator:
    assertCreator<Node.VariableDeclarator>('VariableDeclarator'),
  isChainExpression: assertCreator<Node.ChainExpression>('ChainExpression'),
  isThisExpression: assertCreator<Node.ThisExpression>('ThisExpression'),
  isArrayExpression: assertCreator<Node.ArrayExpression>('ArrayExpression'),
  isObjectExpression: assertCreator<Node.ObjectExpression>('ObjectExpression'),
  isPrivateIdentifier:
    assertCreator<Node.PrivateIdentifier>('PrivateIdentifier'),
  isProperty: assertCreator<Node.Property>('Property'),
  isPropertyDefinition:
    assertCreator<Node.PropertyDefinition>('PropertyDefinition'),
  isFunctionExpression:
    assertCreator<Node.FunctionExpression>('FunctionExpression'),
  isSequenceExpression:
    assertCreator<Node.SequenceExpression>('SequenceExpression'),
  isUnaryExpression: assertCreator<Node.UnaryExpression>('UnaryExpression'),
  isBinaryExpression: assertCreator<Node.BinaryExpression>('BinaryExpression'),
  isAssignmentExpression: assertCreator<Node.AssignmentExpression>(
    'AssignmentExpression',
  ),
  isUpdateExpression: assertCreator<Node.UpdateExpression>('UpdateExpression'),
  isLogicalExpression:
    assertCreator<Node.LogicalExpression>('LogicalExpression'),
  isConditionalExpression: assertCreator<Node.ConditionalExpression>(
    'ConditionalExpression',
  ),
  isNewExpression: assertCreator<Node.NewExpression>('NewExpression'),
  isSwitchCase: assertCreator<Node.SwitchCase>('SwitchCase'),
  isCatchClause: assertCreator<Node.CatchClause>('CatchClause'),
  isIdentifier: assertCreator<Node.Identifier>('Identifier'),
  isLiteral: assertCreator<Node.Literal>('Literal'),
  isSuper: assertCreator<Node.Super>('Super'),
  isSpreadElement: assertCreator<Node.SpreadElement>('SpreadElement'),
  isArrowFunctionExpression: assertCreator<Node.ArrowFunctionExpression>(
    'ArrowFunctionExpression',
  ),
  isYieldExpression: assertCreator<Node.YieldExpression>('YieldExpression'),
  isTemplateLiteral: assertCreator<Node.TemplateLiteral>('TemplateLiteral'),
  isTaggedTemplateExpression: assertCreator<Node.TaggedTemplateExpression>(
    'TaggedTemplateExpression',
  ),
  isTemplateElement: assertCreator<Node.TemplateElement>('TemplateElement'),
  isObjectPattern: assertCreator<Node.ObjectPattern>('ObjectPattern'),
  isArrayPattern: assertCreator<Node.ArrayPattern>('ArrayPattern'),
  isRestElement: assertCreator<Node.RestElement>('RestElement'),
  isAssignmentPattern:
    assertCreator<Node.AssignmentPattern>('AssignmentPattern'),
  isClassBody: assertCreator<Node.ClassBody>('ClassBody'),
  isClassDeclaration: assertCreator<Node.ClassDeclaration>('ClassDeclaration'),
  isClassExpression: assertCreator<Node.ClassExpression>('ClassExpression'),
  isMetaProperty: assertCreator<Node.MetaProperty>('MetaProperty'),
  isImportDeclaration:
    assertCreator<Node.ImportDeclaration>('ImportDeclaration'),
  isImportSpecifier: assertCreator<Node.ImportSpecifier>('ImportSpecifier'),
  isImportExpression: assertCreator<Node.ImportExpression>('ImportExpression'),
  isImportDefaultSpecifier: assertCreator<Node.ImportDefaultSpecifier>(
    'ImportDefaultSpecifier',
  ),
  isImportNamespaceSpecifier: assertCreator<Node.ImportNamespaceSpecifier>(
    'ImportNamespaceSpecifier',
  ),
  isExportNamedDeclaration: assertCreator<Node.ExportNamedDeclaration>(
    'ExportNamedDeclaration',
  ),
  isExportSpecifier: assertCreator<Node.ExportSpecifier>('ExportSpecifier'),
  isExportDefaultDeclaration: assertCreator<Node.ExportDefaultDeclaration>(
    'ExportDefaultDeclaration',
  ),
  isExportAllDeclaration: assertCreator<Node.ExportAllDeclaration>(
    'ExportAllDeclaration',
  ),
  isAwaitExpression: assertCreator<Node.AwaitExpression>('AwaitExpression'),
  isMethodDefinition: assertCreator<Node.MethodDefinition>('MethodDefinition'),
  isMemberExpression: assertCreator<Node.MemberExpression>('MemberExpression'),

  isComment(node: unknown): node is Node.Comment {
    return (
      isSyntaxNode(node) && (node.type === 'Line' || node.type === 'Block')
    );
  },
  isDirective(node: unknown): node is Node.Directive {
    return asserts.isExpressionStatement(node) && 'directive' in node;
  },
  isSimpleCallExpression(node: unknown): node is Node.SimpleCallExpression {
    return isSyntaxNode(node) && node.type === 'CallExpression';
  },
  isAssignmentProperty(node: unknown): node is Node.AssignmentProperty {
    return asserts.isProperty(node) && node.kind === 'init';
  },
  isSimpleLiteral(node: unknown): node is Node.SimpleLiteral {
    return (
      asserts.isLiteral(node) &&
      !asserts.isRegExpLiteral(node) &&
      !asserts.isBigIntLiteral(node)
    );
  },
  isRegExpLiteral(node: unknown): node is Node.RegExpLiteral {
    return asserts.isLiteral(node) && 'regex' in node;
  },
  isBigIntLiteral(node: unknown): node is Node.BigIntLiteral {
    return asserts.isLiteral(node) && 'bigint' in node;
  },
  isExportStatement(node: unknown): node is Node.ExportStatement {
    return (
      asserts.isExportAllDeclaration(node) ||
      asserts.isExportDefaultDeclaration(node) ||
      asserts.isExportNamedDeclaration(node)
    );
  },
} as const;
