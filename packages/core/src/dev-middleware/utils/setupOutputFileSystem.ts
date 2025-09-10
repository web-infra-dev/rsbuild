import type { MultiCompiler } from '@rspack/core';
import type { Context, OutputFileSystem, WithOptional } from '../index';

export async function setupOutputFileSystem(
  context: WithOptional<Context, 'watching' | 'outputFileSystem'>,
): Promise<void> {
  // TODO: refine concrete fs type returned by memfs to match OutputFileSystem
  let outputFileSystem: OutputFileSystem | any;

  if (context.options.writeToDisk !== true) {
    const { createFsFromVolume, Volume } = await import(
      '../../../compiled/memfs/index.js'
    );
    outputFileSystem = createFsFromVolume(new Volume());
  } else {
    const isMultiCompiler = (context.compiler as MultiCompiler).compilers;

    if (isMultiCompiler) {
      const compiler = (context.compiler as MultiCompiler).compilers.filter(
        (item) => Object.hasOwn(item.options, 'devServer'),
      );

      ({ outputFileSystem } =
        compiler[0] || (context.compiler as MultiCompiler).compilers[0]);
    } else {
      ({ outputFileSystem } = context.compiler);
    }
  }

  const compilers = (context.compiler as MultiCompiler).compilers || [
    context.compiler,
  ];

  for (const compiler of compilers) {
    compiler.outputFileSystem = outputFileSystem;
  }

  context.outputFileSystem = outputFileSystem as OutputFileSystem;
}
