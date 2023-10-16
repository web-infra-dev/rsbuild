import path from 'path';
import { expect } from 'vitest';
import { createSnapshotSerializer } from '@rsbuild/vitest-helper';

// Disable chalk in test
process.env.FORCE_COLOR = '0';

expect.addSnapshotSerializer(
  createSnapshotSerializer({
    workspace: path.join(__dirname, '..'),
  }),
);
