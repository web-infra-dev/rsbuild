const openCodes: Record<string, string> = {
  1: 'font-weight:bold', // bold
  2: 'opacity:0.5', // dim
  3: 'font-style:italic', // italic
  4: 'text-decoration:underline', // underscore
  8: 'display:none', // hidden
  9: 'text-decoration:line-through', // delete
  30: 'color:#000', // darkgrey
  31: 'color:#fb6a6a', // red, hsl(0deg 95% 70%)
  32: 'color:#6ef790', // green, hsl(65deg 90% 75%)
  33: 'color:#eff986', // yellow, hsl(185deg 90% 70%)
  34: 'color:#6eb2f7', // blue, hsl(325deg 90% 70%)
  35: 'color:#f76ebe', // magenta, hsl(300deg 90% 70%)
  36: 'color:#6eecf7', // cyan, hsl(210deg 90% 70%)
  37: 'color:#f0f0f0', // lightgrey, hsl(0deg 0% 94%)
  90: 'color:#888', // darkgrey
};

const closeCode = [0, 21, 22, 23, 24, 27, 28, 29, 39, 49];

/**
 * Converts text with ANSI color codes to HTML markup
 */
export function ansiHTML(text: string): string {
  // Cache opened sequence
  const ansiCodes: string[] = [];
  // Replace with markup
  let ret = text.replace(
    // biome-ignore lint/suspicious/noControlCharactersInRegex: allowed
    /\x1B\[([0-9;]+)m/g,
    (_match: string, seq: string): string => {
      const openStyle = openCodes[seq];
      if (openStyle) {
        // If current sequence has been opened, close it.
        if (ansiCodes.indexOf(seq) !== -1) {
          ansiCodes.pop();
          return '</span>';
        }
        // Open tag.
        ansiCodes.push(seq);
        return `<span style="${openStyle};">`;
      }

      if (closeCode.includes(Number(seq))) {
        // Pop sequence
        ansiCodes.pop();
        return '</span>';
      }
      return '';
    },
  );

  // Make sure tags are closed
  if (ansiCodes.length > 0) {
    ret += Array(ansiCodes.length + 1).join('</span>');
  }

  return ret;
}

export default ansiHTML;
