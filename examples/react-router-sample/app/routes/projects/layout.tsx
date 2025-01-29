import { Link, NavLink, Outlet, useLoaderData } from 'react-router';
import type { Route } from './+types/layout';

export function handle() {
  return {
    breadcrumb: () => 'Projects',
  };
}

export function loader() {
  // Simulated data - in a real app, this would come from a database
  return {
    projects: [
      { id: '1', name: 'React Router', status: 'active' },
      { id: '2', name: 'React Query', status: 'completed' },
      { id: '3', name: 'TailwindCSS', status: 'active' },
      { id: '4', name: 'TypeScript', status: 'planned' },
    ],
  };
}

export default function ProjectsLayout() {
  const { projects } = useLoaderData<Route.LoaderData>();

  return (
    <div className="page-container">
      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Projects
              </h2>
              <Link
                to="/projects/new"
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
              >
                New
              </Link>
            </div>

            <nav className="space-y-1">
              {projects.map((project) => (
                <NavLink
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className={({ isActive }: { isActive: boolean }) =>
                    `block px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`
                  }
                >
                  <div className="flex items-center justify-between">
                    <span>{project.name}</span>
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        project.status === 'active'
                          ? 'bg-green-500'
                          : project.status === 'completed'
                            ? 'bg-blue-500'
                            : 'bg-yellow-500'
                      }`}
                    />
                  </div>
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
