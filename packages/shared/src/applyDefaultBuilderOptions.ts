import { CreateBuilderOptions } from './types/builder';

export function applyDefaultBuilderOptions(options?: CreateBuilderOptions) {
  return {
    cwd: process.cwd(),
    entry: {},
    target: ['web'],
    configPath: null,
    ...options,
  } as Required<CreateBuilderOptions>;
}
