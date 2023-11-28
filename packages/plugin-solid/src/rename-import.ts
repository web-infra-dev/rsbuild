import { createVirtualModule } from '@rsbuild/shared';
import { readFileSync } from 'fs';
import type { PluginObj } from '@babel/core';

export default function renameImport(): PluginObj {
  return {
    visitor: {
      ImportDeclaration(path) {
        if (path.node.source.value === 'solid-refresh') {
          const runtimeFilePath = require.resolve(
            'solid-refresh/dist/solid-refresh.mjs',
          );
          const runtimeCode = readFileSync(runtimeFilePath, 'utf-8');
          path.node.source.value = createVirtualModule(runtimeCode);
        }
      },
    },
  };
}
