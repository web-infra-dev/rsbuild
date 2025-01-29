import { useState } from 'react';
import { Link } from 'react-router';
import { Welcome } from '../components/welcome';
import type { Route } from './+types/home';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'React Router Demo' },
    { name: 'description', content: 'A modern React Router demo application' },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: 'Welcome to React Router' };
}

const features = [
  {
    title: 'Dynamic Routing',
    description:
      'React Router enables dynamic, client-side routing in your React applications.',
    link: '/about',
  },
  {
    title: 'Nested Routes',
    description: 'Organize your application with nested routes and layouts.',
    link: '/about',
  },
  {
    title: 'Route Protection',
    description: 'Implement authentication and protect your routes easily.',
    link: '/about',
  },
];

export default function Home({ loaderData }: Route.ComponentProps) {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <>
      <Welcome message={loaderData.message} />

      <div className="page-container">
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`card cursor-pointer transition-all duration-300 ${
                index === activeFeature ? 'ring-2 ring-blue-500' : ''
              }`}
              onMouseEnter={() => setActiveFeature(index)}
            >
              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                {feature.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {feature.description}
              </p>
              <Link
                to={feature.link}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Learn more →
              </Link>
            </div>
          ))}
        </div>

        <div className="card text-center">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            Ready to learn more?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Check out our about page to learn more about the technologies used
            in this demo.
          </p>
          <Link
            to="/about"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View About Page
          </Link>
        </div>
      </div>
    </>
  );
}

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <h1>Count: {count}</h1>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        Increment
      </button>
    </div>
  );
}
