import { hrtime } from 'process';

export function toFixedDigits(num: number, digits = 2): number {
  if (digits === 0) {
    return Math.floor(num);
  }
  return +num.toFixed(digits);
}

export function getUnit(num: number, type: 'm' | 'h') {
  let unit: string;
  if (type === 'm') {
    unit = num > 1 ? 'mins' : 'min';
  } else {
    unit = num > 1 ? 'hours' : 'hour';
  }
  return unit;
}

export function formatCosts(costs: number | string): string {
  costs = Number(costs);

  // more than 1s
  if (costs >= 1000) {
    const sec = costs / 1000;
    // more than 1min
    if (sec >= 60) {
      let mins = sec / 60;
      // more than 1hour
      if (mins >= 60) {
        const hours = toFixedDigits(mins / 60, 0);
        const restMins = toFixedDigits(mins % 60, 1);
        const hUnit = getUnit(hours, 'h');

        if (restMins > 0) {
          return `${hours}${hUnit} ${restMins}${getUnit(restMins, 'm')}`;
        }
        return `${hours}${hUnit}`;
      }

      mins = toFixedDigits(mins, 0);
      const mUnit = getUnit(mins, 'm');
      const restSec = toFixedDigits(sec % 60, 0);

      if (restSec > 0) {
        return `${mins}${mUnit} ${restSec}s`;
      }
      return `${mins}${mUnit}`;
    }

    return `${toFixedDigits(sec, 1)}s`;
  }

  if (costs >= 10) {
    return `${+toFixedDigits(costs, 0)}ms`;
  }

  if (costs >= 1) {
    return `${+toFixedDigits(costs, 1)}ms`;
  }

  let r = +toFixedDigits(costs, 2);

  if (r === 0) {
    r = +toFixedDigits(costs, 3);
  }

  return `${r}ms`;
}

export function getCurrentTimestamp(
  start: number,
  startHRTime: [number, number],
): number {
  const endHRTime = hrtime(startHRTime);
  const end = start + endHRTime[0] * 1000 + endHRTime[1] / 1000000;

  return end;
}
