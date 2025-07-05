import normalSvg from '@assets/circle.svg?not-raw';
import rawSvg from '@assets/circle.svg?raw';
import rawTs from './bar.ts?raw';
import rawTsx from './baz.tsx?raw';
import normalJs from './foo.js?not-raw';
import rawJs from './foo.js?raw';

window.rawSvg = rawSvg;
window.normalSvg = normalSvg;
window.rawJs = rawJs;
window.rawTs = rawTs;
window.rawTsx = rawTsx;
window.normalJs = normalJs;
