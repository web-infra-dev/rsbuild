import { Link, NavLink, Outlet } from 'react-router';

const sidebarItems = [
  { to: '/docs', label: 'Introduction', exact: true },
  { to: '/docs/getting-started', label: 'Getting Started' },
  { to: '/docs/advanced', label: 'Advanced Concepts' },
];

export function handle() {
  return {
    breadcrumb: () => 'Documentation',
  };
}

export default function DocsLayout() {
  return (
    <div className="page-container">
      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <nav className="sticky top-24 space-y-1">
            {sidebarItems.map(({ to, label, exact }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }: { isActive: boolean }) =>
                  `block px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
                end={exact}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
