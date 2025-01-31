import {
  Link,
  Links,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLocation,
  useMatches,
  useRouteError,
} from 'react-router';

import type { Route } from './+types/root';
import './app.css';
// import stylesheet from "./app.css?url";
// console.log(stylesheet);

interface RouteHandle {
  breadcrumb?: (data: any) => string;
}

interface RouteMatch {
  id: string;
  pathname: string;
  params: Record<string, string>;
  data: any;
  handle: RouteHandle;
}

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
  // { rel: "stylesheet", href: stylesheet },
];

function Navigation() {
  const location = useLocation();
  const matches = useMatches() as RouteMatch[];

  const mainNavItems = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/docs', label: 'Documentation' },
    { to: '/projects', label: 'Projects' },
  ];

  const breadcrumbs = matches
    .filter((match) => Boolean(match.handle?.breadcrumb))
    .map((match) => ({
      to: match.pathname,
      label: match.handle.breadcrumb?.(match.data) || '',
    }));

  return (
    <header className="sticky top-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto">
        {/* Main Navigation */}
        <nav className="px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link
                to="/"
                className="text-xl font-bold text-blue-600 dark:text-blue-400"
              >
                React Router Demo
              </Link>
              <div className="flex items-center gap-2">
                {mainNavItems.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }: { isActive: boolean }) =>
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Current path: {location.pathname}
            </div>
          </div>
        </nav>

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="px-4 py-2 text-sm">
            <ol className="flex items-center gap-2">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.to} className="flex items-center gap-2">
                  {index > 0 && <span className="text-gray-400">/</span>}
                  <Link
                    to={crumb.to}
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {crumb.label}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>
    </header>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-gray-200 dark:border-gray-800 py-6 mt-8">
            <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
              React Router Demo Application
            </div>
          </footer>
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

// export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
export function ErrorBoundary() {
  const error = useRouteError();

  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="page-container">
      <div className="card text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {message}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
          {details}
        </p>
        {stack && (
          <pre className="text-left bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
            <code>{stack}</code>
          </pre>
        )}
        <Link
          to="/"
          className="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}
