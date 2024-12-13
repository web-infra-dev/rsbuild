import { Form, Link, Outlet, useLoaderData } from 'react-router';
import type { loader } from './layout.server.js';

export default function Layout() {
  const data = useLoaderData<typeof loader>();
  return (
    <html lang="en">
      <head>
        <title>React Router Custom Framework</title>
      </head>
      <body>
        <div>
          <h1>React Router Custom Framework</h1>

          <Form method="post">
            <p>
              Message: <i>{data.message}</i>
            </p>
            <fieldset>
              <input name="message" placeholder="Enter a new message" />{' '}
              <button type="submit">Update</button>
            </fieldset>
          </Form>

          <p>
            <Link to="/">Home</Link> | <Link to="/about">About</Link>
          </p>

          <hr />

          <Outlet />
        </div>

        <script defer src="/js/entry.client.js" />
      </body>
    </html>
  );
}
