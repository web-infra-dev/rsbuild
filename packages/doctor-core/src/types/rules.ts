import { RuleSetRule } from 'webpack';

export interface Rule extends RuleSetRule {
  /**
   * https://webpack.js.org/configuration/module/#ruleloaders
   */
  loaders: RuleSetRule['use'];
}
