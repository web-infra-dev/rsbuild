import { Rule, Err, Plugin } from '@rsbuild/doctor-types';
import { InternalBasePlugin } from './base';
import { DevToolError } from '@rsbuild/doctor-utils/error';

export class InternalErrorReporterPlugin<
  T extends Plugin.BaseCompiler,
> extends InternalBasePlugin<T> {
  public readonly name = 'error-reporter';

  public apply(compiler: T) {
    compiler.hooks.done.tapPromise(this.tapPreOptions, this.done);
  }

  public done = async (stats: Plugin.BaseStats): Promise<void> => {
    const tasks: Promise<void>[] = [];
    const statsData = stats.toJson({
      all: false,
      errors: true,
      warnings: true,
    });

    if (stats.hasErrors()) {
      tasks.push(this.reportErrors(statsData.errors || []));
    }

    if (stats.hasWarnings()) {
      tasks.push(this.reportWarnings(statsData.warnings || []));
    }

    await Promise.all(tasks);
  };

  public handleWebpackError(
    err: Plugin.BuildError,
    category: Rule.RuleMessageCategory,
    level: keyof typeof Err.ErrorLevel,
  ) {
    return DevToolError.from(err, {
      category,
      code: Rule.RuleMessageCodeEnumerated.Overlay,
      controller: { noStack: false },
      detail: {
        stack: 'stack' in err ? err.stack : err.message,
      },
      level,
    });
  }

  public async reportWarnings(warnings: Plugin.BuildError[]) {
    const arr = warnings.map((warning) => {
      return this.handleWebpackError(
        warning,
        Rule.RuleMessageCategory.Compile,
        'Warn',
      );
    });
    this.sdk.reportError(arr);
  }

  public async reportErrors(errors: Plugin.BuildWarning[]) {
    const arr = errors.map((err) => {
      return this.handleWebpackError(
        err,
        Rule.RuleMessageCategory.Bundle,
        'Error',
      );
    });
    this.sdk.reportError(arr);
  }
}
