import { builtinModules } from 'module';
import { Linter, Rule } from '@rsbuild/doctor-types';
import { parser, getDocument, Node } from '@rsbuild/doctor-utils/ruleUtils';

import type { Config } from './types';
import {
  getDefaultImportByRequest,
  hasSameLeftInAssignStatement,
  getSourceRangeFromTransformedOffset,
  getFixData,
} from './utils';
import { defineRule } from '../../rule';

export type { Config } from './types';

const title = 'default-import-check';

export const rule = defineRule<typeof title, Config>(() => {
  const parserOpt = {
    ecmaVersion: 6 as const,
  };
  const exportsDefault = parser.internal.parseExpressionAt(
    'exports.default',
    0,
    parserOpt,
  ) as Node.SyntaxNode;
  const moduleExportsDefault = parser.internal.parseExpressionAt(
    'module.exports.default',
    0,
    parserOpt,
  ) as Node.SyntaxNode;

  return {
    meta: {
      code: 'E1002' as const,
      title,
      category: 'compile',
      severity: Linter.Severity.Warn,
      defaultConfig: {
        ignore: [],
      },
    },
    check({ moduleGraph, report, ruleConfig }) {
      const dependencyWithNode = moduleGraph
        .getDependencies()
        // Filter the dependencies of dynamic import mode.
        .filter((dep) => dep.meta.exportsType === 'dynamic')
        // Filter user code.
        .filter((dep) => !dep.module.path.includes('node_modules'))
        // Filter non-user configuration ignores and non-nodejs builtin modules.
        .filter(
          (dep) =>
            !ruleConfig.ignore.includes(dep.request) &&
            !builtinModules.includes(dep.request),
        )
        // Filter modules with esm tags
        .filter((dep) => dep.dependency.meta.hasSetEsModuleStatement)
        // Modules that filter AST data.
        .filter((dep) => dep.dependency.getProgram())
        // Filter modules without `exports.default` bottom statement.
        .filter(
          (dep) =>
            !hasSameLeftInAssignStatement(dep.dependency.getProgram()!, [
              exportsDefault,
              moduleExportsDefault,
            ]),
        )
        // The node where the current `import` statement is located
        .map((dependency) => {
          const { module, request } = dependency;
          const node =
            module.getProgram() &&
            getDefaultImportByRequest(module.getProgram()!, request);
          return node
            ? {
                dependency,
                node,
              }
            : {};
        })
        .filter((dep) => dep?.dependency);

      for (const { dependency, node } of dependencyWithNode) {
        if (!dependency) continue;

        const document = getSourceRangeFromTransformedOffset(
          dependency.module,
          node,
        );

        if (!document) {
          continue;
        }

        const message =
          'Do not to use the default import when you import a cjs module.';
        /** Source code and non-external package code are allowed to be modified. */
        const canFix =
          !document.isTransformed && !document.path.includes('node_modules');

        if (canFix) {
          const fixData = getFixData(dependency.module, node, document.range);
          const detail: Linter.ReportDetailData<Rule.CodeChangeRuleStoreData> =
            {
              type: 'code-change',
              file: {
                path: document.path,
                actual: document.content,
                line: document.range.start.line,
                expected: getDocument(document.content).edit(fixData)!,
              },
            };

          report({
            message,
            document,
            detail,
            suggestions: {
              description: 'Use namespace import instead.',
              fixData,
            },
          });
        } else {
          const detail: Linter.ReportDetailData<Rule.CodeViewRuleStoreData> = {
            type: 'code-view',
            file: {
              path: document.path,
              content: document.content,
              ranges: [node.loc!],
            },
          };

          report({
            message,
            document,
            detail,
          });
        }
      }
    },
  };
});
