import { Form, Link, useLoaderData, useNavigation } from 'react-router';
import type { Route } from './+types/edit';

export function handle() {
  return {
    breadcrumb: (data: Route.LoaderData) => `Edit ${data.project.name}`,
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
      team: ['1', '2', '3'],
    },
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const updates = Object.fromEntries(formData);

  // Simulated update - in a real app, this would update the database
  console.log('Updating project', params.projectId, updates);

  return { ok: true };
}

export default function EditProject() {
  const { project } = useLoaderData<Route.LoaderData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Edit Project: {project.name}
        </h1>
      </div>

      <div className="card">
        <Form method="post" className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Project Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              defaultValue={project.name}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={project.description}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={project.status}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            >
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

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
