import { Linter, SDK, Rule as RuleTypes } from '@rsbuild/doctor-types';
import { isPlainObject } from 'lodash';
import { LinterType } from './linter';
import { noop, toSeverity } from './utils';

type DefaultRuleConfig = Linter.DefaultRuleConfig;

export class Rule<Config = DefaultRuleConfig>
  implements Linter.RuleMeta<Config>
{
  static from<C>(data: Linter.ExtendRuleData<C>) {
    return new Rule<C>({
      check: data.check,
      onCheckEnd: data.onCheckEnd,
      meta: {
        ...data.meta,
        code: RuleTypes.RuleMessageCodeEnumerated.Extend,
        severity: toSeverity(data.meta.severity, Linter.Severity.Warn),
      },
    });
  }

  readonly meta: Linter.RuleMeta<Config>;

  private check: Linter.CheckCallback<Config>;

  /**
   * execute when check end
   */
  private onCheckEnd: Linter.OnCheckEndCallback<Config>;

  private _severity: Linter.Severity;

  private _config?: Config;

  constructor(data: Linter.RuleData<Config>) {
    this.check = data.check;
    this.meta = data.meta;
    this.onCheckEnd =
      typeof data.onCheckEnd === 'function' ? data.onCheckEnd : noop;
    this._severity = this.meta.severity;
    this._config = this.meta.defaultConfig;
  }

  get code() {
    return this.meta.code;
  }

  get title() {
    return this.meta.title;
  }

  get severity() {
    return this._severity;
  }

  get config() {
    return this._config;
  }

  get category() {
    return this.meta.category;
  }

  setOption(opt: Linter.RuleConfigItem) {
    let severity: Linter.Severity;
    let config: any;

    if (Array.isArray(opt)) {
      severity = toSeverity(opt[0], this.meta.severity);
      // eslint-disable-next-line prefer-destructuring
      config = opt[1];
    } else {
      severity = toSeverity(opt, this.meta.severity);
      config = undefined;
    }

    this._severity = severity;
    this._config = isPlainObject(config)
      ? {
          ...this.meta.defaultConfig,
          ...config,
        }
      : config || this.meta.defaultConfig;
  }

  match(level: Linter.Severity) {
    if (
      level === Linter.Severity.Ignore ||
      this.severity === Linter.Severity.Ignore
    ) {
      return false;
    }

    if (level === Linter.Severity.Error) {
      return (
        this.severity === Linter.Severity.Error ||
        this.severity === Linter.Severity.Warn
      );
    }

    if (level === Linter.Severity.Warn) {
      return this.severity === Linter.Severity.Warn;
    }

    return false;
  }

  async validate(context: SDK.RuntimeContext): Promise<Linter.ValidateResult> {
    const errors: Linter.Diagnostic[] = [];
    const replace: any[] = [];
    const report = (data: Linter.ReportData, remove: any) => {
      if (remove) {
        replace.push(remove);
      }

      const error: Linter.Diagnostic = {
        ...data,
        code: this.code,
        severity: this.severity,
        category: this.category,
        title: this.title.toUpperCase(),
      };

      errors.push(error);
    };

    await this.check({
      ...context,
      ruleConfig: this.config as Config,
      report,
    });

    return {
      errors,
      replace,
    };
  }

  async afterValidate({
    hooks,
    validateResult,
    data,
  }: LinterType.InternalRuleCheckerContextForCheckEnd<Config>): Promise<void> {
    if (this.onCheckEnd === noop) return;

    await this.onCheckEnd({
      data: {
        ...data,
        ruleConfig: this.config as Config,
      },
      hooks,
      validateResult,
    });
  }
}

export function defineRule<
  Title extends Linter.DefaultRuleTitle,
  T = Linter.DefaultRuleConfig,
>(
  ruleCreator: Linter.ExtendRuleConstructor<Title, T>,
): Linter.ExtendRuleData<T, Title>;
export function defineRule<
  Title extends Linter.DefaultRuleTitle,
  T = Linter.DefaultRuleConfig,
>(ruleCreator: Linter.RuleConstructor<Title, T>): Linter.RuleData<T, Title>;
export function defineRule<
  Title extends Linter.DefaultRuleTitle,
  T = Linter.DefaultRuleConfig,
>(
  ruleCreator:
    | Linter.RuleConstructor<Title, T>
    | Linter.ExtendRuleConstructor<Title, T>,
) {
  return ruleCreator();
}
