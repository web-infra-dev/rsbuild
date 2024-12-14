import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';

// Import the shared db from server
const db = { message: 'Hello world!' };

export async function loader(args: LoaderFunctionArgs) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return { message: db.message };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  db.message = String(formData.get('message'));
  console.log(db);
  return { message: db.message };
}
