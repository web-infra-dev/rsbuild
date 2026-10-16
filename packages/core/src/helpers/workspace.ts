import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { isFileSync } from './fs';

/** Find the nearest workspace root, falling back to the nearest package root. */
export function findWorkspaceRoot(root: string): string {
  let current = root;
  let packageRoot: string | undefined;

  while (true) {
    if (
      isFileSync(join(current, 'pnpm-workspace.yaml')) ||
      isFileSync(join(current, 'lerna.json'))
    ) {
      return current;
    }

    const packageJson = join(current, 'package.json');
    if (isFileSync(packageJson)) {
      packageRoot ??= current;
      try {
        const pkg = JSON.parse(readFileSync(packageJson, 'utf8')) as {
          workspaces?: unknown;
        } | null;
        if (pkg?.workspaces) {
          return current;
        }
      } catch {
        // Ignore unreadable or invalid package.json files.
      }
    }

    const parent = dirname(current);
    if (parent === current) {
      return packageRoot ?? root;
    }
    current = parent;
  }
}
