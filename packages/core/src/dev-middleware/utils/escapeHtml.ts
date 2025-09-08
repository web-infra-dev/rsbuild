const matchHtmlRegExp = /["'&<>]/;

export function escapeHtml(input: string): string {
  const str = `${input}`;
  const match = matchHtmlRegExp.exec(str);

  if (!match) {
    return str;
  }

  let htmlEntity: string | undefined;
  let html = '';
  let index = 0;
  let lastIndex = 0;

  for ({ index } = match as RegExpExecArray; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34:
        htmlEntity = '&quot' + ';';
        break;
      case 38:
        htmlEntity = '&amp' + ';';
        break;
      case 39:
        htmlEntity = '&#39' + ';';
        break;
      case 60:
        htmlEntity = '&lt' + ';';
        break;
      case 62:
        htmlEntity = '&gt' + ';';
        break;
      default:
        // eslint-disable-next-line no-continue
        continue;
    }

    if (lastIndex !== index) {
      html += str.substring(lastIndex, index);
    }

    lastIndex = index + 1;
    html += htmlEntity as string;
  }

  return lastIndex !== index ? html + str.substring(lastIndex, index) : html;
}
