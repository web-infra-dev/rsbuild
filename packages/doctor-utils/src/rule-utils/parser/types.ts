import type * as Node from 'estree';

export { Node };

export enum ECMAVersion {
  ES5 = 'ES5',
  ES6 = 'ES6',
  ES7P = 'ES7+',
}

/**
 * estree supplement type
 * Mainly to match the node type of acorn
 * The main reason for not using the type of acorn directly is that the node type described by acorn itself is too simple
 */
declare module 'estree' {
  interface BaseNode {
    start: number;
    end: number;
    loc?: SourceLocation | undefined;
  }

  interface Position {
    offset: number;
  }

  /** all syntax nodes */
  type SyntaxNode =
    | Node.Comment
    | Node.Program
    | Node.Directive
    | Node.EmptyStatement
    | Node.BlockStatement
    | Node.StaticBlock
    | Node.ExpressionStatement
    | Node.IfStatement
    | Node.LabeledStatement
    | Node.BreakStatement
    | Node.ContinueStatement
    | Node.WithStatement
    | Node.SwitchStatement
    | Node.ReturnStatement
    | Node.ThrowStatement
    | Node.TryStatement
    | Node.WhileStatement
    | Node.DoWhileStatement
    | Node.ForStatement
    | Node.ForInStatement
    | Node.DebuggerStatement
    | Node.FunctionDeclaration
    | Node.VariableDeclaration
    | Node.VariableDeclarator
    | Node.ChainExpression
    | Node.ThisExpression
    | Node.ArrayExpression
    | Node.ObjectExpression
    | Node.PrivateIdentifier
    | Node.Property
    | Node.PropertyDefinition
    | Node.FunctionExpression
    | Node.SequenceExpression
    | Node.UnaryExpression
    | Node.BinaryExpression
    | Node.AssignmentExpression
    | Node.UpdateExpression
    | Node.LogicalExpression
    | Node.ConditionalExpression
    | Node.SimpleCallExpression
    | Node.NewExpression
    | Node.MemberExpression
    | Node.SwitchCase
    | Node.CatchClause
    | Node.Identifier
    | Node.SimpleLiteral
    | Node.RegExpLiteral
    | Node.BigIntLiteral
    | Node.ForOfStatement
    | Node.Super
    | Node.SpreadElement
    | Node.ArrowFunctionExpression
    | Node.YieldExpression
    | Node.TemplateLiteral
    | Node.TaggedTemplateExpression
    | Node.TemplateElement
    | Node.AssignmentProperty
    | Node.ObjectPattern
    | Node.ArrayPattern
    | Node.RestElement
    | Node.AssignmentPattern
    | Node.ClassBody
    | Node.MethodDefinition
    | Node.ClassDeclaration
    | Node.ClassExpression
    | Node.MetaProperty
    | Node.ImportDeclaration
    | Node.ImportSpecifier
    | Node.ImportExpression
    | Node.ImportDefaultSpecifier
    | Node.ImportNamespaceSpecifier
    | Node.ExportNamedDeclaration
    | Node.ExportSpecifier
    | Node.ExportDefaultDeclaration
    | Node.ExportAllDeclaration
    | Node.AwaitExpression;

  /** all operators */
  type SyntaxOperator =
    | Node.UnaryOperator
    | Node.BinaryOperator
    | Node.LogicalOperator
    | Node.AssignmentOperator
    | Node.UpdateOperator;

  /** Block-scoped statement */
  type BlockScopeStatement =
    | Node.StaticBlock
    | Node.BlockStatement
    | Node.ForInStatement
    | Node.ForOfStatement
    | Node.ForStatement
    | Node.CatchClause
    | Node.SwitchStatement;

  /** Export statement */
  type ExportStatement =
    | Node.ExportAllDeclaration
    | Node.ExportDefaultDeclaration
    | Node.ExportNamedDeclaration;
}
