const matchHtmlRegExp = /["'&<>]/;

export function escapeHtml(input: string): string {
  const match = matchHtmlRegExp.exec(input);

  if (!match) {
    return input;
  }

  let htmlEntity: string | undefined;
  let html = '';
  let index = 0;
  let lastIndex = 0;

  for ({ index } = match; index < input.length; index++) {
    switch (input.charCodeAt(index)) {
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
        continue;
    }

    if (lastIndex !== index) {
      html += input.substring(lastIndex, index);
    }

    lastIndex = index + 1;
    html += htmlEntity;
  }

  return lastIndex !== index ? html + input.substring(lastIndex, index) : html;
}
