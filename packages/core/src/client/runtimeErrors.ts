import { formatRuntimeErrors } from './format';
import { createOverlay } from './overlay';

window.addEventListener('error', async (event) => {
  const formatted = await formatRuntimeErrors(event, false);
  createOverlay(formatted);
});

window.addEventListener('unhandledrejection', async (event) => {
  if (event.reason?.stack) {
    const formatted = await formatRuntimeErrors(event, true);
    createOverlay(formatted);
  }
});
