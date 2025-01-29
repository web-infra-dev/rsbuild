import { Link } from 'react-router';
import './about.css';

const teamMembers = [
  {
    name: 'React Router',
    role: 'Routing Library',
    description: 'The most popular routing solution for React applications.',
    link: 'https://reactrouter.com',
  },
  {
    name: 'Tailwind CSS',
    role: 'Styling Framework',
    description: 'A utility-first CSS framework for rapid UI development.',
    link: 'https://tailwindcss.com',
  },
  {
    name: 'TypeScript',
    role: 'Programming Language',
    description:
      'A typed superset of JavaScript that compiles to plain JavaScript.',
    link: 'https://www.typescriptlang.org',
  },
];

export default function About() {
  return (
    <div className="page-container">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          About This Demo
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          A showcase of modern web development tools and practices
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {teamMembers.map((member) => (
          <div key={member.name} className="card">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              {member.name}
            </h2>
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
              {member.role}
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {member.description}
            </p>
            <a
              href={member.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Learn more →
            </a>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          to="/"
          className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-6 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
