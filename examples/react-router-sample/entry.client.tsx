import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import routes from './app/routes.js';

const router = createBrowserRouter(routes, {
  hydrationData: window.__staticRouterHydrationData,
});

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

hydrateRoot(
  root,
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

// type stuff
declare global {
  interface Window {
    __staticRouterHydrationData: any;
  }
}
