import { useLoaderData } from 'react-router';
import type loader from './about.loader.js';
import styles from './about.module.css';

export default function About() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className={styles.about}>
      <h2 className={styles.title}>About This Demo</h2>
      <p className={styles.description}>
        This demo showcases how Rsbuild can be used to create modern React
        applications with server-side rendering and client-side hydration.
      </p>
      <div className={styles.loaderDemo}>
        <h3>Loader Demo</h3>
        <p className={styles.message}>{data.message}</p>
        <p className={styles.note}>
          This message was loaded using React Router's loader functionality,
          demonstrating server/client data loading capabilities.
        </p>
      </div>
    </div>
  );
}
