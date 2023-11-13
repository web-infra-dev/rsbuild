import {
  Node,
  parser,
  getDocument,
  Range,
} from '@rsbuild/doctor-utils/ruleUtils';
import { isUndefined } from 'lodash';
import type { SDK, Linter } from '@rsbuild/doctor-types';

export function getDefaultImportByRequest(node: Node.Program, request: string) {
  return parser.utils
    .getDefaultImports(node)
    .find((decl) => decl.source.value === request);
}

/**
 * Determine that it contains the same left value assignment expression in the enumeration.
 */
export function hasSameLeftInAssignStatement(
  node: Node.Program,
  compare: Node.SyntaxNode[],
) {
  return node.body
    .filter(parser.asserts.isExpressionStatement)
    .map((node) => node.expression)
    .filter(parser.asserts.isAssignmentExpression)
    .map((node) => node.left)
    .find((node) =>
      compare.some((item) => parser.utils.isSameSemantics(node, item)),
    );
}

export function importDeclarationToString(node: Node.ImportDeclaration) {
  const defaultSpecifier = node.specifiers[0] as Node.ImportDefaultSpecifier;
  const rawRequest = (node.source.raw ?? '').trim();
  return `import * as ${defaultSpecifier.local.name} from ${rawRequest}`;
}

export function getFixData(
  module: SDK.ModuleInstance,
  node: Node.ImportDeclaration,
  originalRange: Range,
): Linter.FixData {
  const { source, transformed } = module.getSource();
  const document = getDocument(source);
  const newImportText = importDeclarationToString(node);
  const oldText = transformed.substring(node.start, node.end);
  const hasLastSemi = oldText[oldText.length - 1] === ';';

  return {
    start: document.offsetAt(originalRange.start)!,
    end: document.offsetAt(originalRange.end)!,
    newText: hasLastSemi ? `${newImportText};` : newImportText,
  };
}

export function getSourceRangeFromTransformedOffset(
  module: SDK.ModuleInstance,
  node: Node.SyntaxNode,
): Linter.ReportDocument | undefined {
  const source = module.getSource();
  const sourceMap = module.getSourceMap();
  const transformedStart = node.loc!.start;
  const transformedEnd = node.loc!.end;

  if (!transformedStart || !transformedEnd) {
    return;
  }

  const transformedReport = {
    path: module.path,
    content: source.transformed,
    isTransformed: true,
    range: {
      start: transformedStart,
      end: transformedEnd,
    },
  };

  if (!sourceMap) {
    return transformedReport;
  }

  const sourceRange = module.getSourceRange(node.loc!);

  if (
    isUndefined(sourceRange?.start.line) ||
    isUndefined(sourceRange?.start.column) ||
    isUndefined(sourceRange?.end?.line) ||
    isUndefined(sourceRange?.end?.column)
  ) {
    return transformedReport;
  }

  return {
    path: module.path,
    isTransformed: false,
    content: source.source,
    range: sourceRange as Range,
  };
}
