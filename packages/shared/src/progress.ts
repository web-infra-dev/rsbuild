import type { Colors } from './color';

const colorList: Colors[] = ['green', 'cyan', 'yellow', 'blue', 'magenta'];

export const getProgressColor = (index: number) =>
  colorList[index % colorList.length];
