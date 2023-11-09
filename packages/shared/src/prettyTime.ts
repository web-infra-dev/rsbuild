import { color } from './color';

export const prettyTime = (seconds: number) => {
  const format = (time: string) => color.bold(Number(time));

  if (seconds < 1) {
    const digits = seconds >= 0.01 ? 2 : 3;
    return `${format(seconds.toFixed(digits))} s`;
  }

  if (seconds < 60) {
    return `${format(seconds.toFixed(1))} s`;
  }

  const minutes = seconds / 60;
  return `${format(minutes.toFixed(2))} m`;
};
