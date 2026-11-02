import { readFileSync } from 'node:fs';

export default function (source) {
  // Control chunk changes through explicit rebuilds, without file watch races.
  this.cacheable(false);
  const extra = readFileSync(this.getOptions().stateFile, 'utf8') === 'true';
  return extra ? `import './extra.js';\n${source}` : source;
}
