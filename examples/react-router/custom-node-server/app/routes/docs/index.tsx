import { Link } from 'react-router';

export function handle() {
  return {
    breadcrumb: () => 'Introduction',
  };
}

const exampleCode = `import { createBrowserRouter } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
    ],
  },
]);`;

export default function DocsIndex() {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1>Introduction to React Router</h1>
      <p className="lead">
        React Router is a powerful routing library for React applications that
        enables you to build single-page applications with dynamic, client-side
        routing.
      </p>

      <h2>Key Features</h2>
      <ul>
        <li>
          <strong>Dynamic Routes</strong> - Create routes with URL parameters
          and handle them dynamically
        </li>
        <li>
          <strong>Nested Routes</strong> - Organize your application with nested
          layouts and routes
        </li>
        <li>
          <strong>Route Protection</strong> - Implement authentication and
          protect sensitive routes
        </li>
        <li>
          <strong>Data Loading</strong> - Load data for your routes before
          rendering
        </li>
      </ul>

      <h2>Getting Started</h2>
      <p>
        Ready to start building? Check out our{' '}
        <Link
          to="/docs/getting-started"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Getting Started
        </Link>{' '}
        guide to learn the basics.
      </p>

      <h2>Example Usage</h2>
      <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
        <code>{exampleCode}</code>
      </pre>

      <h2>Next Steps</h2>
      <p>
        Once you're comfortable with the basics, explore our{' '}
        <Link
          to="/docs/advanced"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Advanced Concepts
        </Link>{' '}
        to learn about more powerful features.
      </p>
    </div>
  );
}
