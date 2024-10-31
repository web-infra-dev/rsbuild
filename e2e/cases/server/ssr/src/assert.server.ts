function assertQueueMicroTask() {
  if (typeof queueMicrotask !== 'function') {
    throw Error('not support queueMicrotask in this environment');
  }
}

export function assert() {
  assertQueueMicroTask();
}
