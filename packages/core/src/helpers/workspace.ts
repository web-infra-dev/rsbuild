import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import stripJsonComments from 'strip-json-comments';
import { isFileSync } from './fs';

function hasWorkspaceField(
  file: string,
  field: string,
  jsonc = false,
): boolean {
  // Avoid opening missing files and creating ENOENT errors at every ancestor.
  if (!isFileSync(file)) {
    return false;
  }

  try {
    const content = readFileSync(file, 'utf8');
    const config = JSON.parse(
      jsonc ? stripJsonComments(content, { trailingCommas: true }) : content,
    ) as Record<string, unknown> | null;
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
      hasWorkspaceField(join(current, 'deno.json'), 'workspace', true) ||
      hasWorkspaceField(join(current, 'deno.jsonc'), 'workspace', true)
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
