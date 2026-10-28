let buildNumber = 0;

export default function (source) {
  // Generate new code on each explicit rebuild without filesystem watch events.
  this.cacheable(false);
  return source.replace('BUILD_NUMBER', String(++buildNumber));
}
