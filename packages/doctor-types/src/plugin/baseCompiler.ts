import type {
  Compiler,
  Compilation,
  Stats,
  StatsError,
  RuleSetRule,
} from 'webpack';
import type {
  Compiler as RspackCompiler,
  Compilation as RspackCompilation,
  Stats as RspackStats,
  RuleSetRule as RspackRuleSetRule,
  RuleSetRules,
} from '@rspack/core';

export type BaseCompiler = (Compiler | RspackCompiler) & { webpack: any };

export type BaseCompilation = RspackCompilation | Compilation;

export type BaseStats = Stats | RspackStats;

export interface JsStatsError {
  message: string;
  formatted: string;
  title: string;
}

export interface JsStatsWarning {
  message: string;
  formatted: string;
}

export type BuildError = JsStatsError | StatsError;
export type BuildWarning = JsStatsWarning | StatsError;

export type BuildRuleSetRules = (RuleSetRule | '...')[] | RuleSetRules;
export type BuildRuleSetRule = RuleSetRule | RspackRuleSetRule;
