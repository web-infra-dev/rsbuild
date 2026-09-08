import { hydrate } from '@solidjs/web';

// Keep the hydration runtime in the bundle without invoking it.
globalThis.hydrate = hydrate;
