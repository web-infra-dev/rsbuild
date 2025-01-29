import { Link } from 'react-router';

export function handle() {
  return {
    breadcrumb: () => 'Getting Started',
  };
}

const installCode = `# Using npm
npm install react-router-dom

# Using yarn
yarn add react-router-dom

# Using pnpm
pnpm add react-router-dom`;

const setupCode = `import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./routes/root";
import ErrorPage from "./error-page";
import Contact from "./routes/contact";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "contacts/:contactId",
        element: <Contact />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);`;

export default function GettingStarted() {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1>Getting Started with React Router</h1>
      <p className="lead">
        Learn how to add React Router to your project and create your first
        routes.
      </p>

      <h2>Installation</h2>
      <p>First, install React Router using your preferred package manager:</p>
      <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
        <code>{installCode}</code>
      </pre>

      <h2>Basic Setup</h2>
      <p>
        Create a router instance and wrap your app with{' '}
        <code>RouterProvider</code>:
      </p>
      <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
        <code>{setupCode}</code>
      </pre>

      <h2>Creating Routes</h2>
      <p>Routes are defined as objects with the following properties:</p>
      <ul>
        <li>
          <code>path</code> - The URL pattern for this route
        </li>
        <li>
          <code>element</code> - The component to render for this route
        </li>
        <li>
          <code>errorElement</code> - Component to render when an error occurs
        </li>
        <li>
          <code>children</code> - Nested routes
        </li>
      </ul>

      <h2>URL Parameters</h2>
      <p>
        Dynamic segments in your routes are marked with a colon, like{' '}
        <code>:contactId</code> in the example above. Access these parameters
        using the <code>useParams</code> hook:
      </p>
      <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
        <code>{`function Contact() {
  const { contactId } = useParams();
  return <h1>Contact {contactId}</h1>;
}`}</code>
      </pre>

      <h2>Next Steps</h2>
      <p>
        Now that you understand the basics, check out the{' '}
        <Link
          to="/docs/advanced"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Advanced Concepts
        </Link>{' '}
        to learn about loaders, actions, and more.
      </p>
    </div>
  );
}
