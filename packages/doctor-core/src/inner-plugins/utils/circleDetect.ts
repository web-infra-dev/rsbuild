export const checkCirclePath = (
  obj: any,
  record: { prop: string; ref: unknown }[],
  res: string[][],
  level: number,
  maxLevel = 3,
) => {
  const idx = record
    .slice(0, record.length - 1)
    .findIndex((v) => v.ref === obj);

  if (idx !== -1) {
    const key = record.map((v) => v.prop);
    if (res.indexOf(key) < 0) {
      res.push(key);
      return;
    }
  }
  if (typeof obj === 'object' && obj !== null && level < maxLevel) {
    // This is not to judge whether there is a cycle in the maxLevel layer depth of the object, but to record only maxLevel layers from the beginning of the cycle.
    for (const [k, v] of Object.entries(obj)) {
      checkCirclePath(v, [...record, { prop: k, ref: v }], res, level + 1);
    }
  }
};
