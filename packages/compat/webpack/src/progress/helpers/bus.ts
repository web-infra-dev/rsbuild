import { Console } from 'node:console';
import cliTruncate from 'cli-truncate';
import patchConsole from 'patch-console';
import { FULL_WIDTH, renderBar } from './bar.js';
import type { LogUpdate } from './log.js';
import { create } from './log.js';
import type { Colors, Props } from './types.js';

const colorList: Colors[] = ['green', 'cyan', 'yellow', 'blue', 'magenta'];

export const getProgressColor = (index: number) =>
  colorList[index % colorList.length];

class Bus {
  states: Partial<Props>[] = [];

  log: LogUpdate;

  restore: () => void;

  prevOutput: string;

  destroyed = false;

  constructor() {
    this.prevOutput = '';
    this.log = create(process.stdout);
    console.Console = Console;
    this.restore = patchConsole((type, data) => {
      this.writeToStd(type, data);
    });
  }

  update(state: Partial<Props>) {
    const index = this.states.findIndex((i) => i.id === state.id);
    if (index === -1) {
      this.states.push(state);
      return;
    }
    this.states[index] = state;
  }

  writeToStd(type: 'stdout' | 'stderr' = 'stdout', data?: string) {
    this.log.clear();

    if (data) {
      if (type === 'stdout') {
        process.stdout.write(data);
      } else if (type === 'stderr') {
        process.stderr.write(data);
      }
    }

    this.log(this.prevOutput);
  }

  render() {
    const maxIdLen = Math.max(...this.states.map((i) => i.id?.length ?? 0)) + 2;
    const { columns = FULL_WIDTH } = process.stdout;
    this.prevOutput = this.states
      .map((i, k) => {
        const bar = renderBar({
          maxIdLen,
          color: i.color ?? getProgressColor(k),
          ...i,
        });
        if (bar) {
          return cliTruncate(bar, columns, { position: 'end' });
        }
        return null;
      })
      .filter((item) => item !== null)
      .join('\n');

    this.writeToStd();
  }

  destroy() {
    if (!this.destroyed) {
      this.restore();
    }
    this.destroyed = true;
  }

  clear() {
    this.log.clear();
    this.log.done();
  }
}
const bus = new Bus();

export { bus };
