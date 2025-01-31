//@ts-nocheck

import type { Config } from '@react-router/dev/config';

export default {
  // Server-side render by default
  ssr: true,
  // Build output directory
  buildDirectory: 'build',
  // Application source directory
  appDirectory: 'app',
  // Base URL path for the application
  basename: '/',
} satisfies Config;
