let used = false;

export function use() {
  used = true;
}

export function test() {
  if (used) {
    return 'dce-unused-mutator-removed';
  }

  return 'dce-unused-mutator-expected';
}
