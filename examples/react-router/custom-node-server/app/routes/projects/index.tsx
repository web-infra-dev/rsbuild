import { Link, useLoaderData } from 'react-router';
import type { Route } from './+types/index';

export function handle() {
  return {
    breadcrumb: () => 'All Projects',
  };
}

export function loader() {
  // Simulated data - in a real app, this would come from a database
  return {
    stats: {
      total: 4,
      active: 2,
      completed: 1,
      planned: 1,
    },
    recentActivity: [
      {
        id: '1',
        action: 'updated',
        project: 'React Router',
        user: 'John',
        time: '2 hours ago',
      },
      {
        id: '2',
        action: 'created',
        project: 'TypeScript',
        user: 'Sarah',
        time: '1 day ago',
      },
      {
        id: '3',
        action: 'completed',
        project: 'React Query',
        user: 'Mike',
        time: '3 days ago',
      },
    ],
  };
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}
        >
          <span className="text-xl font-bold text-white">{value}</span>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {label}
          </h3>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsIndex() {
  const { stats, recentActivity } = useLoaderData<Route.LoaderData>();

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Projects"
          value={stats.total}
          color="bg-blue-600"
        />
        <StatCard label="Active" value={stats.active} color="bg-green-600" />
        <StatCard
          label="Completed"
          value={stats.completed}
          color="bg-purple-600"
        />
        <StatCard label="Planned" value={stats.planned} color="bg-yellow-600" />
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-300">
                  {activity.user}
                </span>
                <span className="text-gray-400 dark:text-gray-500">•</span>
                <span
                  className={`text-sm ${
                    activity.action === 'created'
                      ? 'text-green-600 dark:text-green-400'
                      : activity.action === 'updated'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-purple-600 dark:text-purple-400'
                  }`}
                >
                  {activity.action}
                </span>
                <Link
                  to={`/projects/${activity.id}`}
                  className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {activity.project}
                </Link>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Create Project Button */}
      <div className="flex justify-center">
        <Link
          to="/projects/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <title>Add Icon</title>
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Create New Project
        </Link>
      </div>
    </div>
  );
}
