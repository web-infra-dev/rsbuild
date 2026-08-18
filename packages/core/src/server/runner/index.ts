/**
 * The following code is modified based on @rspack/test-tools/runner
 */
import { color, require } from '../../helpers';
import { CommonJsRunner } from './cjs';
import { EsmRunner } from './esm';
import { SystemJsRunner } from './systemJs';
import type { Runner, RunnerFactory, RunnerFactoryOptions } from './type';

class BasicRunnerFactory implements RunnerFactory {
  constructor(protected name: string) {}

  async create(options: RunnerFactoryOptions): Promise<Runner> {
    const runner = await this.createRunner(options);
    return runner;
  }

  protected async createRunner(options: RunnerFactoryOptions): Promise<Runner> {
    const runnerOptions = {
      name: this.name,
      ...options,
    };
    const { compilerOptions } = options;
    if (
      compilerOptions.target === 'web' ||
      compilerOptions.target === 'webworker'
    ) {
      throw new Error(
        `${color.dim('[rsbuild:runner]')} Not support run ${color.yellow(
          compilerOptions.target,
        )} resource in Rsbuild server`,
      );
    }

    if (!compilerOptions.output.module) {
      return new CommonJsRunner(runnerOptions);
    }

    // rslint-disable-next-line @typescript-eslint/no-require-imports
    const vm = require('node:vm') as typeof import('node:vm');
    if (vm.SourceTextModule) {
      return new EsmRunner(runnerOptions);
    }

    return new SystemJsRunner(runnerOptions);
  }
}

export const run = async <T>({
  bundlePath,
  ...runnerFactoryOptions
}: RunnerFactoryOptions & {
  bundlePath: string;
}): Promise<T> => {
  const runnerFactory = new BasicRunnerFactory(bundlePath);
  const runner = await runnerFactory.create(runnerFactoryOptions);
  const mod = await runner.run(bundlePath);

  return mod as T;
};
