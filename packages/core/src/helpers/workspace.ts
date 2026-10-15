import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { isFileSync } from './fs';

function hasWorkspaceField(file: string, field: string): boolean {
  try {
    const config = JSON.parse(readFileSync(file, 'utf8')) as Record<
      string,
      unknown
    > | null;
    return Boolean(config?.[field]);
  } catch {
    return false;
  }
}

/** Find the nearest workspace root, falling back to the nearest package root. */
export function findWorkspaceRoot(root: string): string {
  let current = root;
  let packageRoot: string | undefined;

  while (true) {
    const packageJson = join(current, 'package.json');
    if (!packageRoot && isFileSync(packageJson)) {
      packageRoot = current;
    }

    if (
      isFileSync(join(current, 'pnpm-workspace.yaml')) ||
      isFileSync(join(current, 'lerna.json')) ||
      hasWorkspaceField(packageJson, 'workspaces') ||
      hasWorkspaceField(join(current, 'deno.json'), 'workspace') ||
      // Only detect deno.jsonc files that are also valid JSON.
      hasWorkspaceField(join(current, 'deno.jsonc'), 'workspace')
    ) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      return packageRoot ?? root;
    }
    current = parent;
  }
}
