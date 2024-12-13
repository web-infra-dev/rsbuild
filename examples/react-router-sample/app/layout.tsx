import { Form, Link, Outlet, useLoaderData, useNavigation } from 'react-router';
import styles from './layout.module.css';
import type { loader } from './layout.server.js';

export default function Layout() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === 'submitting';

  return (
    <>
      <header className={styles.header}>
        <div className={styles.container}>
          <h1 className={styles.title}>Rsbuild React Router App</h1>
          <nav className={styles.nav}>
            <Link className={styles.link} to="/">
              Home
            </Link>
            <Link className={styles.link} to="/about">
              About
            </Link>
          </nav>
        </div>
      </header>

      <div className={styles.container}>
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <div className={styles.messageSection}>
              <h2 className={styles.subtitle}>Message Board</h2>
              <Form method="post" className={styles.form}>
                <p className={styles.messageDisplay}>
                  Current Message:{' '}
                  <span className={styles.message}>{data.message}</span>
                </p>
                <fieldset className={styles.fieldset} disabled={isSubmitting}>
                  <input
                    className={styles.input}
                    name="message"
                    placeholder="Enter a new message"
                    aria-label="New message"
                  />
                  <button className={styles.button} type="submit">
                    {isSubmitting ? 'Updating...' : 'Update Message'}
                  </button>
                </fieldset>
              </Form>
            </div>
          </aside>

          <main className={styles.main}>
            <div className={styles.contentSection}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <p>Built with Rsbuild and React Router</p>
        </div>
      </footer>
    </>
  );
}
