import { parser, Node } from '@rsbuild/doctor-utils/ruleUtils';

const esmLabelStatement = parser.internal.parseExpressionAt(
  'Object.defineProperty(exports, "__esModule", { value: true })',
  0,
  {
    ecmaVersion: 6,
    ranges: false,
    locations: false,
    sourceType: 'script',
  },
);

export function hasSetEsModuleStatement(program: Node.Program) {
  const expressions = program.body
    .filter(parser.asserts.isExpressionStatement)
    .map((item) => item.expression)
    .filter(parser.asserts.isSimpleCallExpression);

  return expressions.some((exp) =>
    parser.utils.isSameSemantics(exp, esmLabelStatement),
  );
}
