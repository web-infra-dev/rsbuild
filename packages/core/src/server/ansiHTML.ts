/**
 * This module is modified based on `ansi-html-community`
 * https://github.com/mahdyar/ansi-html-community
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * https://github.com/mahdyar/ansi-html-community/blob/master/LICENSE
 */

// https://github.com/chalk/ansi-regex
function ansiRegex() {
  // Valid string terminator sequences are BEL, ESC\, and 0x9c
  const ST = '(?:\\u0007|\\u001B\\u005C|\\u009C)';
  const pattern = [
    `[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?${ST})`,
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
  ].join('|');

  return new RegExp(pattern, 'g');
}

const colors: Record<string, string> = {
  black: '#000',
  // hsl(0deg 95% 70%)
  red: '#fb6a6a',
  // hsl(135deg 90% 70%)
  green: '#6ef790',
  // hsl(65deg 90% 75%)
  yellow: '#eff986',
  // hsl(185deg 90% 70%)
  cyan: '#6eecf7',
  // hsl(210deg 90% 70%)
  blue: '#6eb2f7',
  // hsl(325deg 90% 70%)
  magenta: '#f76ebe',
  lightgrey: '#f0f0f0',
  darkgrey: '#888',
};

const styles: Record<string, string> = {
  30: 'black',
  31: 'red',
  32: 'green',
  33: 'yellow',
  34: 'blue',
  35: 'magenta',
  36: 'cyan',
  37: 'lightgrey',
};

const openTags: Record<string, string> = {
  '1': 'font-weight:bold', // bold
  '2': 'opacity:0.5', // dim
  '3': '<i>', // italic
  '4': '<u>', // underscore
  '8': 'display:none', // hidden
  '9': '<del>', // delete
};

const closeTags: Record<string, string> = {
  '23': '</i>', // reset italic
  '24': '</u>', // reset underscore
  '29': '</del>', // reset delete
};

for (const n of [0, 21, 22, 27, 28, 39, 49]) {
  closeTags[n.toString()] = '</span>';
}

/**
 * Converts text with ANSI color codes to HTML markup.
 */
export function ansiHTML(text: string): string {
  // Returns the text if the string has no ANSI escape code.
  if (!ansiRegex().test(text)) {
    return text;
  }

  // Cache opened sequence.
  const ansiCodes: string[] = [];
  // Replace with markup.
  let ret = text.replace(
    // biome-ignore lint/suspicious/noControlCharactersInRegex: allowed
    /\x1B\[(\d+)m/g,
    (_match: string, seq: string): string => {
      const ot = openTags[seq];
      if (ot) {
        // If current sequence has been opened, close it.
        if (ansiCodes.indexOf(seq) !== -1) {
          ansiCodes.pop();
          return '</span>';
        }
        // Open tag.
        ansiCodes.push(seq);
        return ot[0] === '<' ? ot : `<span style="${ot}">`;
      }

      const ct = closeTags[seq];
      if (ct) {
        // Pop sequence
        ansiCodes.pop();
        return ct;
      }
      return '';
    },
  );

  // Make sure tags are closed.
  const l = ansiCodes.length;
  if (l > 0) {
    ret += Array(l + 1).join('</span>');
  }

  return ret;
}

function setTags(): void {
  openTags['90'] = `color:${colors.darkgrey}`;

  for (const code in styles) {
    const color = styles[code];
    const oriColor = colors[color] || colors.black;
    openTags[code] = `color:${oriColor}`;
  }
}

setTags();

export default ansiHTML;
