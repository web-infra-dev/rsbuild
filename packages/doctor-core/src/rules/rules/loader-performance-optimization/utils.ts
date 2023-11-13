export function match(str: string, partterns: (string | RegExp)[]) {
  if (partterns.length === 0) return false;

  return partterns.some((p) => {
    if (typeof p === 'string') return str === p;
    if (p instanceof RegExp) return p.test(str);
    return false;
  });
}
