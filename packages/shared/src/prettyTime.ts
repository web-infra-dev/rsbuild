import { color } from './color';

export const prettyTime = (seconds: number) => {
  if (seconds < 1) {
    const digits = seconds >= 0.01 ? 2 : 3;
    return `${color.bold(seconds.toFixed(digits))} s`;
  }

  if (seconds < 60) {
    return `${color.bold(seconds.toFixed(1))} s`;
  }

  const minutes = seconds / 60;
  return `${color.bold(minutes.toFixed(2))} m`;
};
