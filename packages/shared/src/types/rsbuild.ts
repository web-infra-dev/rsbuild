import type { EntryDescription } from '@rspack/core';

export type RsbuildTarget = 'web' | 'node' | 'web-worker' | 'service-worker';

export type RsbuildEntry = Record<string, string | string[] | EntryDescription>;

export type RsbuildMode = 'development' | 'production';
