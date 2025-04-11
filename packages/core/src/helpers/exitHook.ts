import process from 'node:process';

type Callback = (exitCode: number) => void;

const callbacks = new Set<Callback>();

let isCalled = false;
let isRegistered = false;

function exit(signal: number, type: 'SIGINT' | 'SIGTERM' | 'exit') {
  if (isCalled) {
    return;
  }

  isCalled = true;
  const exitCode = 128 + signal;
  for (const callback of callbacks) {
    callback(exitCode);
  }

  if (type === 'SIGINT') {
    const listeners = process.listeners('SIGINT');
    // If some other listeners are registered, do not exit the process
    if (Array.isArray(listeners) && listeners.length <= 1) {
      process.exit(exitCode);
    }
  }
}

export function exitHook(onExit: Callback): () => void {
  callbacks.add(onExit);

  if (!isRegistered) {
    isRegistered = true;
    // CTRL+C
    // Use `process.on` instead of `process.once` to disable
    // Node.js default exit behavior
    process.on('SIGINT', exit.bind(undefined, 2, 'SIGINT'));
    // CTRL+D or `kill` command
    process.once('SIGTERM', exit.bind(undefined, 15, 'SIGTERM'));
    // process.exit or others
    process.once('exit', exit.bind(undefined, -128, 'exit'));
  }

  return () => {
    callbacks.delete(onExit);
  };
}
