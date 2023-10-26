const sep = '!';

export function encode(str: string) {
  let res = `${str.charCodeAt(0)}`;

  for (let i = 1; i < str.length; i++) {
    res += `${sep}${str.charCodeAt(i)}`;
  }

  return res;
}

export function decode(str: string) {
  let res = '';
  let tmp = '';

  for (let i = 0; i < str.length; i++) {
    if (str[i] === sep) {
      res += String.fromCharCode(+tmp);
      tmp = '';
    } else {
      // 'number'
      tmp += str[i];
    }
  }

  // end of str
  if (tmp) {
    res += String.fromCharCode(+tmp);
  }

  return res;
}
