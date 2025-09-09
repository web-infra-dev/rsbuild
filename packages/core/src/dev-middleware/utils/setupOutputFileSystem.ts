import fs from 'node:fs';
import type { MultiCompiler, OutputFileSystem } from '@rspack/core';
import { isMultiCompiler } from '../../helpers';
import type { Context, WithOptional } from '../index';

export async function setupOutputFileSystem(
  context: WithOptional<Context, 'watching' | 'outputFileSystem'>,
): Promise<void> {
  let outputFileSystem: OutputFileSystem;

  if (context.options.writeToDisk) {
    const firstCompiler = isMultiCompiler(context.compiler)
      ? context.compiler.compilers[0]
      : context.compiler;
    outputFileSystem = firstCompiler.outputFileSystem || fs;
  } else {
    const { createFsFromVolume, Volume } = await import(
      '../../../compiled/memfs/index.js'
    );
    outputFileSystem = createFsFromVolume(new Volume()) as OutputFileSystem;
  }

  const compilers = (context.compiler as MultiCompiler).compilers || [
    context.compiler,
  ];

  for (const compiler of compilers) {
    compiler.outputFileSystem = outputFileSystem;
  }
  context.outputFileSystem = outputFileSystem;
}
