import fs from 'node:fs';
import path from 'node:path';
import * as acorn from 'acorn';
import { tsPlugin } from 'acorn-typescript';
import * as acornWalk from 'acorn-walk';

const extensions = ['', '.js', '.ts', '.mjs', '.mts', '.cjs', '.cts'];

/**
 * resolvePath('./foo') -> '/path/to/foo.js'
 */
const resolvePath = (importPath: string, dir?: string): string | null => {
  if (notAlias(importPath)) {
    for (const ext of extensions) {
      const resolvedPath =
        (path.isAbsolute(importPath)
          ? importPath
          : path.resolve(dir ?? process.cwd(), importPath)) + ext;
      if (fs.existsSync(resolvedPath)) {
        return resolvedPath;
      }
    }
  }

  return null;
};

const notAlias = (importPath: string) =>
  importPath.startsWith('.') || importPath.startsWith('/');

interface DependenciesTree {
  [filePath: string]: {
    dependencies: DependenciesTree;
  };
}

export function analyzingDependencies({
  filePath,
  processed = [],
}: {
  filePath: string;
  processed?: string[];
}): DependenciesTree {
  const deps: DependenciesTree = {};
  const absPath = resolvePath(filePath);
  if (!absPath) return deps;
  // to prevent circular deps
  processed.push(absPath);

  const dir = path.dirname(absPath);
  const content = fs.readFileSync(absPath, 'utf-8');

  // @ts-expect-error
  const ast = acorn.Parser.extend(tsPlugin()).parse(content, {
    sourceType: 'module',
    ecmaVersion: 'latest',
    allowImportExportEverywhere: true,
  });

  const appendDep = (importedLiteralPath: string) => {
    const absImportedPath = resolvePath(importedLiteralPath, dir);
    if (
      absImportedPath &&
      !deps[absImportedPath] &&
      !processed.includes(absImportedPath)
    ) {
      deps[absImportedPath] = {
        dependencies: analyzingDependencies({
          filePath: absImportedPath,
          processed,
        }),
      };
    }
  };

  acornWalk.simple(ast, {
    // parse it like `import foo from './foo'`
    ImportDeclaration(node) {
      if (typeof node.source.value === 'string') {
        appendDep(node.source.value);
      }
    },
    ImportExpression(node) {
      // parse it like `const foo = import('./foo')`
      if (
        node.source.type === 'Literal' &&
        typeof node.source.value === 'string'
      ) {
        appendDep(node.source.value);
      }
    },
    CallExpression(node) {
      // parse it like `const foo = require('./foo')`
      if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'require' &&
        node.arguments?.[0].type === 'Literal' &&
        typeof node.arguments[0].value === 'string'
      ) {
        appendDep(node.arguments[0].value);
      }
    },
  });

  return deps;
}

function extractFilePaths(
  deps: DependenciesTree,
  filePaths: string[] = [],
): string[] {
  for (const filePath in deps) {
    filePaths.push(filePath);

    if (deps[filePath].dependencies) {
      extractFilePaths(deps[filePath].dependencies, filePaths);
    }
  }
  return filePaths;
}

export function getDependencyFiles(filePath: string): string[] {
  const deps = analyzingDependencies({ filePath });
  return extractFilePaths(deps);
}
