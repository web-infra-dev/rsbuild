let used = false;

export function use() {
  used = true;
}

export function test() {
  if (used) {
    return 'dce-removed-value';
  }

  return 'dce-expected-value';
}
