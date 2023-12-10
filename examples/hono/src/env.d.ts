import '@rsbuild/core/types';
import type { RsbuildTarget } from '@rsbuild/core';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TARGET: RsbuildTarget;
    }
  }
}
