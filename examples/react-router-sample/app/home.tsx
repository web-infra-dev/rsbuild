import styles from './home.module.css';
export const ServerAction = async () => {};

export default function Home() {
  return (
    <div className={styles.home}>
      <h2 className={styles.title}>Welcome to Rsbuild</h2>
      <p className={styles.description}>
        This is a demo app showcasing Rsbuild with React Router and Server-Side
        Rendering.
      </p>
      <div className={styles.features}>
        <div className={styles.feature}>
          <h3>Server-Side Rendering</h3>
          <p>Full SSR support with hydration</p>
        </div>
        <div className={styles.feature}>
          <h3>React Router</h3>
          <p>Modern routing with data loading</p>
        </div>
        <div className={styles.feature}>
          <h3>Asset Management</h3>
          <p>Automatic CSS and JS handling</p>
        </div>
      </div>
    </div>
  );
}
