import { color } from './color';
import basePrettyTime from '../compiled/pretty-time';

const TIME_REGEXP = /([\d.]+)([a-zA-Z]+)/;

export const prettyTime = (time: number | [number, number], digits = 1) => {
  const timeStr: string = basePrettyTime(time, digits);

  return timeStr.replace(TIME_REGEXP, (match, p1, p2) => {
    if (p1 && p2) {
      let time = p1;

      // remove digits of ms time
      if (p2 === 'ms') {
        time = Number(time).toFixed(0);
      }

      return `${color.bold(time)} ${p2}`;
    }
    return color.bold(match);
  });
};
