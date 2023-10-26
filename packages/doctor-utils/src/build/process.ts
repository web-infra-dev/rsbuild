import bytes from 'bytes';
import { memoryUsage, pid } from 'process';

export function getMemoryUsage() {
  return memoryUsage();
}

export function getMemoryUsageMessage() {
  const usage = getMemoryUsage();

  // https://nodejs.org/api/process.html#processmemoryusage
  const msgs = [
    `RSS: ${bytes(usage.rss)}`,
    `Heap Total: ${bytes(usage.heapTotal)}`,
    `Heap Used: ${bytes(usage.heapUsed)}`,
  ];

  if (usage.arrayBuffers) {
    msgs.push(`ArrayBuffers: ${bytes(usage.arrayBuffers)}`);
  }

  if (usage.external) {
    msgs.push(`External: ${bytes(usage.external)}`);
  }

  return `["${pid}" Memory Usage] ${msgs.join(', ')}`;
}
