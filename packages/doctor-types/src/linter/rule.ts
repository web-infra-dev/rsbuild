import type { ArrayToUnion, UnionToTuple } from '../common';
import type { ErrorLevel as Severity } from '../error';
import type { Hooks, RuntimeContext } from '../sdk';
import type { ReportData, Diagnostic } from './diagnostic';
import type { RuleMessage } from '../rule';

/** Error level */
export type SeverityString = keyof typeof Severity;

/** Error level */
export type SeverityInput = SeverityString | 'off' | 'on';

/** Rule configuration */
export type DefaultRuleConfig = any;
export type DefaultRuleTitle = string;

/** Rule check context */
export interface RuleCheckerContext<Config = DefaultRuleConfig>
  extends RuntimeContext {
  ruleConfig: Config;
  /**
   * Report an error
   * @param {any} error - error data
   * @param {any} replacer - replace the original error
   */
  report(error: ReportData, replacer?: any): void;
}

/**
 * we shouldn't report any errors when the rule check end, so remove the report function on the context.
 */
export interface RuleCheckerContextForCheckEnd<Config = DefaultRuleConfig> {
  /**
   * data of the rule.
   */
  data: Omit<RuleCheckerContext<Config>, 'report'>;
  /**
   * the validate result for `all` rules.
   */
  validateResult: ValidateResult;
  /**
   * sdk hooks for rule context when check end.
   *
   * rules checking always run after builder compile done, so it must be a part of SDK.Hooks.
   */
  hooks: Pick<Hooks, 'afterSaveManifest'>;
}

export interface InternalRuleCheckerContextForCheckEnd<
  Config = DefaultRuleConfig,
> extends Omit<RuleCheckerContextForCheckEnd<Config>, 'data'> {
  data: Omit<RuleCheckerContext<Config>, 'report' | 'ruleConfig'>;
}

export type CheckCallback<Config = DefaultRuleConfig> = (
  context: RuleCheckerContext<Config>,
) => void | Promise<void>;

export type OnCheckEndCallback<Config = DefaultRuleConfig> = (
  context: RuleCheckerContextForCheckEnd<Config>,
) => void | Promise<void>;

/** Rule Metadata */
export interface RuleMeta<
  Config = DefaultRuleConfig,
  Title extends DefaultRuleTitle = DefaultRuleTitle,
> extends Pick<RuleMessage, 'code' | 'category'> {
  title: Title;
  severity: Severity;
  /** Detailed document link */
  referenceUrl?: string;
  /** Default configuration */
  defaultConfig?: Config;
}

export interface BaseRuleData<Config> {
  check: CheckCallback<Config>;
  /**
   * execute when all rules check end.
   */
  onCheckEnd?: OnCheckEndCallback<Config>;
}

/** Rule Data */
export interface RuleData<
  Config = DefaultRuleConfig,
  Title extends DefaultRuleTitle = DefaultRuleTitle,
> extends BaseRuleData<Config> {
  meta: RuleMeta<Config, Title>;
}

/** External Rule Metadata */
export interface ExtendRuleMeta<
  Config = DefaultRuleConfig,
  Title extends DefaultRuleTitle = DefaultRuleTitle,
> extends Omit<RuleMeta<Config, Title>, 'severity' | 'code'> {
  severity: SeverityString;
}

/** External rule data */
export interface ExtendRuleData<
  Config = DefaultRuleConfig,
  Title extends DefaultRuleTitle = DefaultRuleTitle,
> extends BaseRuleData<Config> {
  meta: ExtendRuleMeta<Config, Title>;
}

/** rule constructor */
export type RuleConstructor<
  Title extends DefaultRuleTitle,
  Config = DefaultRuleConfig,
> = () => RuleData<Config, Title>;

/** External rule constructor */
export type ExtendRuleConstructor<
  Title extends DefaultRuleTitle,
  Config = DefaultRuleConfig,
> = () => ExtendRuleData<Config, Title>;

/** Rule configuration */
export type RulesMap = Record<string, RuleConfigItem>;

/** Single rule configuration */
export type RuleConfigItem<T = unknown> =
  // There is only an error level, which takes precedence over the rule's own configuration.
  | SeverityInput
  // In the case of an array, the first item is the error level, and the latter item is the rule configuration.
  | [SeverityInput, T];

/** Verification result */
export interface ValidateResult {
  errors: Diagnostic[];
  replace: any[];
}

/** Verifier options */
export interface Options<
  Extends extends ExtendRuleData[] = [],
  InternalRules extends RuleData[] = [],
  _Extends = UnionToTuple<ArrayToUnion<[...Extends]>>,
> {
  rules?: InferRulesConfig<
    _Extends extends ExtendRuleData[] ? _Extends : Extends
  > &
    InferRulesConfig<InternalRules>;
  level?: SeverityString;
  extends?: Extends;
}

type InferRuleTitle<T extends ExtendRuleData | RuleData> =
  T['meta']['title'] extends `${infer R}` ? R : string;

type InferRulesTitles<T extends (ExtendRuleData | RuleData)[]> = ArrayToUnion<{
  [K in keyof T]: InferRuleTitle<T[K]>;
}>;

type InferRuleConfigByTitle<
  T extends (ExtendRuleData | RuleData)[],
  Title extends string,
> = {
  [K in keyof T]: InferRuleTitle<T[K]> extends Title
    ? InferRuleConfig<T[K]>
    : never;
}[number];

export type InferRuleConfig<T> = T extends ExtendRuleData<infer P1>
  ? P1
  : T extends RuleData<infer P2>
  ? P2
  : any;

export type InferRulesConfig<T extends (ExtendRuleData | RuleData)[]> = {
  [K in InferRulesTitles<T>]?: RuleConfigItem<InferRuleConfigByTitle<T, K>>;
} & {
  [key: string]: RuleConfigItem;
};
