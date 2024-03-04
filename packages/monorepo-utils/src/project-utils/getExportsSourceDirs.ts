import path from 'node:path';
import type { ExportsConfig } from '../types/packageJson';

export function getExportsSourceDirs(
  exportsConfig: ExportsConfig,
  sourceField: string,
) {
  const exportsSourceDirs: string[] = [];

  for (const moduleRules of Object.values(exportsConfig)) {
    if (
      typeof moduleRules === 'object' &&
      typeof moduleRules[sourceField] === 'string'
    ) {
      exportsSourceDirs.push(
        path.normalize(moduleRules[sourceField] as string),
      );
    }
  }

  // normalize strings
  return exportsSourceDirs;
}
