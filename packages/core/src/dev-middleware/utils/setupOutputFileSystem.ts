import type { MultiCompiler } from '@rspack/core';
import { createFsFromVolume, Volume } from 'memfs';
import type { Context, OutputFileSystem, WithOptional } from '../index';

export function setupOutputFileSystem(
  context: WithOptional<Context, 'watching' | 'outputFileSystem'>,
): void {
  // TODO: refine concrete fs type returned by memfs to match OutputFileSystem
  let outputFileSystem: OutputFileSystem | any;

  if (context.options.writeToDisk !== true) {
    outputFileSystem = createFsFromVolume(new Volume());
  } else {
    const isMultiCompiler = (context.compiler as MultiCompiler).compilers;

    if (isMultiCompiler) {
      const compiler = (context.compiler as MultiCompiler).compilers.filter(
        (item) => Object.hasOwn(item.options, 'devServer'),
      );

      ({ outputFileSystem } =
        compiler[0] ||
        ((context.compiler as MultiCompiler).compilers[0] as any));
    } else {
      ({ outputFileSystem } = context.compiler as any);
    }
  }

  const compilers = (context.compiler as MultiCompiler).compilers || [
    context.compiler,
  ];

  for (const compiler of compilers as any[]) {
    // @ts-ignore
    compiler.outputFileSystem = outputFileSystem;
  }

  // @ts-ignore
  // eslint-disable-next-line no-param-reassign
  (context as any).outputFileSystem = outputFileSystem as OutputFileSystem;
}
