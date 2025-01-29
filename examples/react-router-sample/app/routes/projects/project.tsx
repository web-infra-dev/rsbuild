import { Link, useLoaderData, useParams } from 'react-router';
import type { Route } from './+types/project';

export function handle() {
  return {
    breadcrumb: (data: Route.LoaderData) => data.project.name,
  };
}

export function loader({ params }: Route.LoaderArgs) {
  // Simulated data - in a real app, this would come from a database
  return {
    project: {
      id: params.projectId,
      name: 'React Router',
      description: 'A comprehensive routing library for React applications.',
      status: 'active',
      progress: 75,
      tasks: {
        total: 12,
        completed: 9,
      },
      team: [
        { id: '1', name: 'John Doe', role: 'Lead', avatar: 'JD' },
        { id: '2', name: 'Sarah Smith', role: 'Developer', avatar: 'SS' },
        { id: '3', name: 'Mike Johnson', role: 'Designer', avatar: 'MJ' },
      ],
      activity: [
        {
          id: '1',
          user: 'John',
          action: 'updated the description',
          time: '2 hours ago',
        },
        {
          id: '2',
          user: 'Sarah',
          action: 'completed Task #5',
          time: '1 day ago',
        },
        {
          id: '3',
          user: 'Mike',
          action: 'added new design files',
          time: '3 days ago',
        },
      ],
    },
  };
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
      <div
        className="bg-blue-600 h-2.5 rounded-full"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function Avatar({ name, initials }: { name: string; initials: string }) {
  return (
    <div
      className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center"
      title={name}
    >
      <span className="text-sm font-medium text-blue-700 dark:text-blue-100">
        {initials}
      </span>
    </div>
  );
}

export default function Project() {
  const { project } = useLoaderData<Route.LoaderData>();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {project.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {project.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="edit"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Edit
          </Link>
          <Link
            to="settings"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Settings
          </Link>
        </div>
      </div>

      {/* Progress */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Progress
        </h2>
        <div className="space-y-4">
          <ProgressBar value={project.progress} />
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">
              {project.tasks.completed} of {project.tasks.total} tasks completed
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {project.progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Team
        </h2>
        <div className="space-y-4">
          {project.team.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
            >
              <div className="flex items-center gap-3">
                <Avatar name={member.name} initials={member.avatar} />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {member.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {member.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        <div className="space-y-4">
          {project.activity.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-900 dark:text-white">
                  {item.user}
                </span>
                <span className="text-gray-400 dark:text-gray-500">•</span>
                <span className="text-gray-600 dark:text-gray-300">
                  {item.action}
                </span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
