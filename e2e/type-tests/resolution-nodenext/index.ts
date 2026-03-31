// This folder disables `skipLibCheck` to check the public types of @rsbuild/core.
import '@rsbuild/core/types';
import { createRsbuild, defineConfig } from '@rsbuild/core';

createRsbuild({});

defineConfig({});
