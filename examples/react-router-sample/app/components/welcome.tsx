/** @jsxRuntime automatic */
/** @jsxImportSource react */

import { Link } from 'react-router';

// import logoDark from "./logo-dark.svg";
// import logoLight from "./logo-light.svg";

const resources = [
  {
    href: 'https://reactrouter.com/docs',
    text: 'React Router Documentation',
    description: 'Learn everything about React Router v6 and its features.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 text-blue-600 dark:text-blue-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <title>Documentation Icon</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
  {
    href: 'https://github.com/remix-run/react-router',
    text: 'GitHub Repository',
    description: 'Explore the source code and contribute to React Router.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 text-blue-600 dark:text-blue-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <title>GitHub Icon</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
        />
      </svg>
    ),
  },
  {
    href: 'https://reactrouter.com/blog',
    text: 'React Router Blog',
    description: 'Stay updated with the latest news and updates.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 text-blue-600 dark:text-blue-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <title>Blog Icon</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15"
        />
      </svg>
    ),
  },
];

export function Welcome({ message }: { message: string }) {
  return (
    <div className="page-container">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {message}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Get started with React Router and explore its powerful features
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {resources.map(({ href, text, description, icon }) => (
          <a
            key={href}
            className="card group hover:ring-2 hover:ring-blue-500 transition-all"
            href={href}
            target="_blank"
            rel="noreferrer"
          >
            <div className="flex items-center gap-4 mb-4">
              {icon}
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {text}
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300">{description}</p>
          </a>
        ))}
      </div>

      <div className="card text-center">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          Ready to explore more?
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Check out our about page to learn more about the technologies used in
          this demo.
        </p>
        <Link
          to="/about"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          View About Page
        </Link>
      </div>
    </div>
  );
}
