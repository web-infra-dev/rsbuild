import { Form, Link, useLoaderData, useNavigation } from 'react-router';
import type { Route } from './+types/settings';

export function handle() {
  return {
    breadcrumb: (data: Route.LoaderData) => `${data.project.name} Settings`,
  };
}

export function loader({ params }: Route.LoaderArgs) {
  // Simulated data - in a real app, this would come from a database
  return {
    project: {
      id: params.projectId,
      name: 'React Router',
      visibility: 'public',
      notifications: {
        email: true,
        slack: false,
        discord: true,
      },
      dangerZone: {
        archiveProject: false,
        deleteProject: false,
      },
    },
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const updates = Object.fromEntries(formData);

  // Simulated update - in a real app, this would update the database
  console.log('Updating project settings', params.projectId, updates);

  return { ok: true };
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
        <div className="sm:col-span-2">{children}</div>
      </div>
    </div>
  );
}

export default function ProjectSettings() {
  const { project } = useLoaderData<Route.LoaderData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Project Settings
        </h1>
      </div>

      <div className="card">
        <Form method="post" className="space-y-8">
          <SettingsSection
            title="Visibility"
            description="Control who can see your project"
          >
            <select
              name="visibility"
              defaultValue={project.visibility}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            >
              <option value="private">Private</option>
              <option value="team">Team Only</option>
              <option value="public">Public</option>
            </select>
          </SettingsSection>

          <SettingsSection
            title="Notifications"
            description="Choose how you want to be notified"
          >
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="notifications.email"
                  defaultChecked={project.notifications.email}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-900 dark:text-white">
                  Email notifications
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="notifications.slack"
                  defaultChecked={project.notifications.slack}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-900 dark:text-white">
                  Slack notifications
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="notifications.discord"
                  defaultChecked={project.notifications.discord}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-900 dark:text-white">
                  Discord notifications
                </span>
              </label>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Danger Zone"
            description="Destructive actions for your project"
          >
            <div className="space-y-4">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 border border-transparent rounded-md hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Archive Project
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-transparent rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Project
              </button>
            </div>
          </SettingsSection>

          <div className="flex justify-end gap-3">
            <Link
              to=".."
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
