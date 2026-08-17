import { runCLI } from '@rsbuild/core';

process.stdin.isTTY = true;
delete process.env.CI;

runCLI({ argv: ['node', 'rsbuild', 'dev'] });
