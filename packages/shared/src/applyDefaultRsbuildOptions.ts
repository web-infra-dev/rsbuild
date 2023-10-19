import { CreateRsbuildOptions } from './types/builder';

export function applyDefaultRsbuildOptions(options?: CreateRsbuildOptions) {
  return {
    cwd: process.cwd(),
    entry: {},
    target: ['web'],
    configPath: null,
    ...options,
  } as Required<CreateRsbuildOptions>;
}
