import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from '@react-router/dev/routes';

export default [
  // Index route for the home page
  index('routes/home.tsx'),

  // About page
  route('about', 'routes/about.tsx'),

  // Docs section with nested routes
  layout('routes/docs/layout.tsx', [
    index('routes/docs/index.tsx'),
    route('getting-started', 'routes/docs/getting-started.tsx'),
    route('advanced', 'routes/docs/advanced.tsx'),
  ]),

  // Projects section with dynamic segments
  ...prefix('projects', [
    index('routes/projects/index.tsx'),
    layout('routes/projects/layout.tsx', [
      route(':projectId', 'routes/projects/project.tsx'),
      route(':projectId/edit', 'routes/projects/edit.tsx'),
      route(':projectId/settings', 'routes/projects/settings.tsx'),
    ]),
  ]),
] satisfies RouteConfig;
