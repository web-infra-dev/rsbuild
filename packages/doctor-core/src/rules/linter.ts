import { Linter as LinterType, SDK } from '@rsbuild/doctor-types';
import { Rule } from './rule';
import { rules as allRules } from './rules';
import { toSeverity } from './utils';

export { LinterType };

export class Linter<Rules extends LinterType.ExtendRuleData[]> {
  private rules: Rule<any>[] = [];

  constructor({
    rules,
    extends: extendRules,
    level,
  }: LinterType.Options<Rules> = {}) {
    this.rules = this.getRules(
      rules ?? {},
      extendRules ?? [],
      toSeverity(level ?? 'Error', LinterType.Severity.Error),
    );
  }

  private getRules(
    ruleMap: LinterType.InferRulesConfig<Rules>,
    extendRules: LinterType.ExtendRuleData[],
    filterLevel: LinterType.Severity,
  ) {
    const outside = extendRules.map((item) => Rule.from(item));
    const rules = allRules
      .map((item) => new Rule<LinterType.DefaultRuleConfig>(item))
      .concat(outside);

    rules.forEach((rule) => {
      if (ruleMap[rule.title]) {
        rule.setOption(ruleMap[rule.title]);
      }
    });

    return rules.filter((rule) => rule.match(filterLevel));
  }

  async validate(context: SDK.RuntimeContext) {
    const lintResult: LinterType.ValidateResult = {
      errors: [],
      replace: [],
    };

    await Promise.all(
      this.rules.map(async (rule) => {
        const result = await rule.validate(context);
        lintResult.errors.push(...result.errors);
        lintResult.replace.push(...result.replace);
      }),
    );

    return lintResult;
  }

  async afterValidate(
    context: LinterType.InternalRuleCheckerContextForCheckEnd,
  ) {
    await Promise.all(this.rules.map((rule) => rule.afterValidate(context)));
  }
}
