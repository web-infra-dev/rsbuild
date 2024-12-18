import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';

export default [
  layout('layout.tsx', [index('home.tsx'), route('about', 'about.tsx')]),
] satisfies RouteConfig;
