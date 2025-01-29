import { Link } from 'react-router';

export function handle() {
  return {
    breadcrumb: () => 'Advanced Concepts',
  };
}

const loaderCode = `// Route definition
{
  path: "projects/:projectId",
  element: <Project />,
  loader: async ({ params }) => {
    const project = await fetchProject(params.projectId);
    if (!project) {
      throw new Response("", { status: 404 });
    }
    return project;
  },
}

// Component
function Project() {
  const project = useLoaderData();
  return <h1>{project.name}</h1>;
}`;

const actionCode = `// Route definition
{
  path: "projects/new",
  element: <NewProject />,
  action: async ({ request }) => {
    const formData = await request.formData();
    const project = await createProject(formData);
    return redirect(\`/projects/\${project.id}\`);
  },
}

// Component
function NewProject() {
  const { state } = useNavigation();
  const isSubmitting = state === "submitting";

  return (
    <Form method="post">
      <input name="name" type="text" />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Project"}
      </button>
    </Form>
  );
}`;

const errorCode = `// Route definition
{
  path: "projects/:projectId",
  element: <Project />,
  errorElement: <ProjectError />,
}

// Error component
function ProjectError() {
  const error = useRouteError();
  return (
    <div className="error-container">
      <h1>Oops!</h1>
      <p>{error.message}</p>
    </div>
  );
}`;

export default function Advanced() {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1>Advanced React Router Concepts</h1>
      <p className="lead">
        Explore powerful features like data loading, form handling, and error
        boundaries.
      </p>

      <h2>Data Loading with Loaders</h2>
      <p>
        Loaders let you load data before rendering a route. They run before the
        route is rendered and their data is available to the component via the{' '}
        <code>useLoaderData</code> hook:
      </p>
      <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
        <code>{loaderCode}</code>
      </pre>

      <h2>Form Handling with Actions</h2>
      <p>
        Actions handle form submissions and other data mutations. They work with
        the <code>Form</code> component to provide a seamless form handling
        experience:
      </p>
      <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
        <code>{actionCode}</code>
      </pre>

      <h2>Error Handling</h2>
      <p>
        Error boundaries catch errors during rendering, data loading, and data
        mutations:
      </p>
      <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
        <code>{errorCode}</code>
      </pre>

      <h2>Next Steps</h2>
      <p>
        Check out our{' '}
        <Link
          to="/projects"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Projects Demo
        </Link>{' '}
        to see these concepts in action.
      </p>
    </div>
  );
}
