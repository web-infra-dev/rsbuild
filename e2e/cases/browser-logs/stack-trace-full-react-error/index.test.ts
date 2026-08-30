import { test } from '@e2e/helper';

const EXPECTED_LOG = `error   [browser] Uncaught ReferenceError: undefinedValue is not defined
    at App (src/App.jsx:4:0)`;

const EXPECTED_REACT_STACK_FRAME =
  / {4}at .+ \((?:[^)\n]*\/)?node_modules\/react-dom\/[^)\n]+:\d+:\d+\)/;

test('should display formatted full stack trace in React component', async ({
  dev,
}) => {
  const rsbuild = await dev();
  await rsbuild.expectLog(EXPECTED_LOG, { posix: true });
  await rsbuild.expectLog(EXPECTED_REACT_STACK_FRAME, { posix: true });
});
