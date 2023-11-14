import { NODE_MODULES_REGEX, TS_AND_JSX_REGEX } from '../constants';
import type {
  WebpackChainRule,
  BundlerChainRule,
  NormalizedConfig,
  Context,
} from '../types';

export function applyScriptCondition({
  rule,
  config,
  context,
  includes,
  excludes,
}: {
  rule: BundlerChainRule | WebpackChainRule;
  config: NormalizedConfig;
  context: Context;
  includes: (string | RegExp)[];
  excludes: (string | RegExp)[];
}) {
  // compile all folders in app directory, exclude node_modules
  rule.include.add({
    and: [context.rootPath, { not: NODE_MODULES_REGEX }],
  });

  // Always compile TS and JSX files.
  // Otherwise, it will lead to compilation errors and incorrect output.
  rule.include.add(TS_AND_JSX_REGEX);

  [...includes, ...(config.source.include || [])].forEach((condition) => {
    rule.include.add(condition);
  });

  [...excludes, ...(config.source.exclude || [])].forEach((condition) => {
    rule.exclude.add(condition);
  });
}
