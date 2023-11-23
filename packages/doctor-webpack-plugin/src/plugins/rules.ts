import { InternalBasePlugin } from '@rsbuild/doctor-core/plugins';
import { Linter } from '@rsbuild/doctor-core/rules';
import { DevToolError } from '@rsbuild/doctor-utils/error';
import { isArray, pull } from 'lodash';
import type { Compilation, Compiler, Stats, WebpackError } from 'webpack';

export class InternalRulesPlugin extends InternalBasePlugin<Compiler> {
  public readonly name = 'rules';

  public apply(compiler: Compiler) {
    compiler.hooks.done.tapPromise(this.tapPreOptions, this.done);
  }

  public done = async (stats: Stats): Promise<void> => {
    await this.lint(stats.compilation);
  };

  protected async lint(compilation: Compilation) {
    const options = this.options ?? {};
    const linter = new Linter(options.linter);
    const result = await linter.validate(this.sdk.getRuleContext({}));
    const validateErrors = result.errors.map((err) =>
      DevToolError.from(err, {
        detail: err.detail,
        controller: {
          noColor: true,
        },
      }),
    );

    const errors = validateErrors.filter((item) => item.level === 'Error');
    const warnings = validateErrors.filter((item) => item.level === 'Warn');
    const toWebpackError = (err: DevToolError) =>
      err.toError() as unknown as WebpackError;

    result.replace.forEach((item) => {
      if (isArray(compilation.errors) && compilation.errors.includes(item)) {
        pull(compilation.errors, item);
      }
      if (
        isArray(compilation.warnings) &&
        compilation.warnings.includes(item)
      ) {
        pull(compilation.warnings, item);
      }
    });

    if (isArray(compilation.errors)) {
      errors.forEach((err) => {
        compilation.warnings.push(toWebpackError(err));
      });
    }

    if (isArray(compilation.warnings)) {
      warnings.forEach((err) => {
        compilation.warnings.push(toWebpackError(err));
      });
    }

    this.sdk.reportError(validateErrors);

    await linter.afterValidate({
      data: this.sdk.getRuleContext({}),
      validateResult: result,
      hooks: {
        afterSaveManifest: this.sdk.hooks.afterSaveManifest,
      },
    });
  }
}
