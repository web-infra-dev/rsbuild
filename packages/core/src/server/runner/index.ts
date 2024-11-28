/**
 * The following code is modified based on @rspack/test-tools/runner
 *
 * TODO: should be extracted as a separate bundle-runner pkg
 */
import { EsmRunner } from './esm';
import type { CompilerOptions, Runner, RunnerFactory } from './type';

export class BasicRunnerFactory implements RunnerFactory {
  constructor(protected name: string) {}

  create(
    compilerOptions: CompilerOptions,
    dist: string,
    readFileSync: (path: string) => string,
  ): Runner {
    const runner = this.createRunner(compilerOptions, dist, readFileSync);
    return runner;
  }

  protected createRunner(
    compilerOptions: CompilerOptions,
    dist: string,
    readFileSync: (path: string) => string,
  ): Runner {
    const runnerOptions = {
      name: this.name,
      dist,
      compilerOptions,
      readFileSync,
    };
    if (
      compilerOptions.target === 'web' ||
      compilerOptions.target === 'webworker'
    ) {
      throw new Error(
        `[rsbuild:runner] Not support run "${compilerOptions.target}" resource in Rsbuild server`,
      );
    }
    return new EsmRunner(runnerOptions);
  }
}

export const run = async <T>(
  bundlePath: string,
  outputPath: string,
  compilerOptions: CompilerOptions,
  readFileSync: (path: string) => string,
): Promise<T> => {
  const runnerFactory = new BasicRunnerFactory(bundlePath);
  const runner = runnerFactory.create(
    compilerOptions,
    outputPath,
    readFileSync,
  );
  const mod = runner.run(bundlePath);

  return mod as T;
};
