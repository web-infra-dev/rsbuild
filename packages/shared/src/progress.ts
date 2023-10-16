import type { chalk } from './re-exports/chalk';

type Color = typeof chalk['ForegroundColor'];

const colorList: Array<Color> = [
  'green',
  'cyan',
  'yellow',
  'blue',
  'greenBright',
  'cyanBright',
  'yellowBright',
  'blueBright',
  'redBright',
  'magentaBright',
];

export const getProgressColor = (index: number) =>
  colorList[index % colorList.length];
