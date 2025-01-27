import { ansiHTML } from '../src/server/ansiHTML';
import { convertLinksInHtml } from '../src/server/overlay';

describe('ansiHTML', () => {
  it('should convert ANSI color codes to HTML', () => {
    const redInput = '\x1B[31mHello, World!\x1B[0m';
    const redExpected = '<span style="color:#fb6a6a;">Hello, World!</span>';
    expect(ansiHTML(redInput)).toEqual(redExpected);

    const blueInput = '\x1B[34mHello, World!\x1B[0m';
    const blueExpected = '<span style="color:#6eb2f7;">Hello, World!</span>';
    expect(ansiHTML(blueInput)).toEqual(blueExpected);

    const greenInput = '\x1B[32mHello, World!\x1B[0m';
    const greenExpected = '<span style="color:#6ef790;">Hello, World!</span>';
    expect(ansiHTML(greenInput)).toEqual(greenExpected);

    const yellowInput = '\x1B[33mHello, World!\x1B[0m';
    const yellowExpected = '<span style="color:#eff986;">Hello, World!</span>';
    expect(ansiHTML(yellowInput)).toEqual(yellowExpected);

    const cyanInput = '\x1B[36mHello, World!\x1B[0m';
    const cyanExpected = '<span style="color:#6eecf7;">Hello, World!</span>';
    expect(ansiHTML(cyanInput)).toEqual(cyanExpected);

    const magentaInput = '\x1B[35mHello, World!\x1B[0m';
    const magentaExpected = '<span style="color:#f76ebe;">Hello, World!</span>';
    expect(ansiHTML(magentaInput)).toEqual(magentaExpected);

    const lightgreyInput = '\x1B[37mHello, World!\x1B[0m';
    const lightgreyExpected =
      '<span style="color:#f0f0f0;">Hello, World!</span>';
    expect(ansiHTML(lightgreyInput)).toEqual(lightgreyExpected);

    const darkgreyInput = '\x1B[90mHello, World!\x1B[0m';
    const darkgreyExpected = '<span style="color:#888;">Hello, World!</span>';
    expect(ansiHTML(darkgreyInput)).toEqual(darkgreyExpected);
  });

  it('should convert ANSI bold codes to HTML', () => {
    const input = '\x1B[1mHello, World!\x1B[0m';
    const expected = '<span style="font-weight:bold;">Hello, World!</span>';
    expect(ansiHTML(input)).toEqual(expected);
  });

  it('should convert ANSI dim codes to HTML', () => {
    const input = '\x1B[2mHello, World!\x1B[0m';
    const expected = '<span style="opacity:0.5;">Hello, World!</span>';
    expect(ansiHTML(input)).toEqual(expected);
  });

  it('should convert ANSI italic codes to HTML', () => {
    const input = '\x1B[3mHello, World!\x1B[0m';
    const expected = '<span style="font-style:italic;">Hello, World!</span>';
    expect(ansiHTML(input)).toEqual(expected);
  });

  it('should convert ANSI underline codes to HTML', () => {
    const input = '\x1B[4mHello, World!\x1B[0m';
    const expected =
      '<span style="text-decoration:underline;text-underline-offset:3px;">Hello, World!</span>';
    expect(ansiHTML(input)).toEqual(expected);
  });

  it('should convert ANSI delete codes to HTML', () => {
    const input = '\x1B[9mHello, World!\x1B[0m';
    const expected =
      '<span style="text-decoration:line-through;">Hello, World!</span>';
    expect(ansiHTML(input)).toEqual(expected);
  });

  it('should convert multiple styles ', () => {
    const input = '\x1B[31;1;4mHello, World!\x1B[0m';
    const expected =
      '<span style="color:#fb6a6a;font-weight:bold;text-decoration:underline;text-underline-offset:3px;">Hello, World!</span>';
    expect(ansiHTML(input)).toEqual(expected);
  });

  it('should convert file path with ANSI color codes to HTML', () => {
    const input = '[\u001b[36;1;4m/path/to/src/index.js\u001b[0m:4:1]';
    const expected =
      '[<span style="color:#6eecf7;font-weight:bold;text-decoration:underline;text-underline-offset:3px;">/path/to/src/index.js</span>:4:1]';
    expect(ansiHTML(input)).toEqual(expected);
  });

  it('should ignore background colors', () => {
    const bgRedInput = '\x1B[41mHello, World!\x1B[0m';
    const bgRedExpected = 'Hello, World!';
    expect(ansiHTML(bgRedInput)).toEqual(bgRedExpected);

    const bgBlueInput = '\x1B[44;1mHello, World!\x1B[0m';
    const bgBlueExpected =
      '<span style="font-weight:bold;">Hello, World!</span>';
    expect(ansiHTML(bgBlueInput)).toEqual(bgBlueExpected);
  });

  it('should handle nested styles', () => {
    const input = '\x1B[31mRed \x1B[1mBold Red \x1B[34mBold Blue\x1B[0m';
    const expected =
      '<span style="color:#fb6a6a;">Red <span style="font-weight:bold;">Bold Red <span style="color:#6eb2f7;">Bold Blue</span></span></span>';
    expect(ansiHTML(input)).toEqual(expected);
  });

  it('should handle bright colors', () => {
    const input = '\x1B[91mBright Red\x1B[0m';
    const expected = '<span style="color:#fb6a6a;">Bright Red</span>';
    expect(ansiHTML(input)).toEqual(expected);
  });

  it('should handle reset within text', () => {
    const input = '\x1B[31mRed\x1B[0m Normal \x1B[34mBlue\x1B[0m';
    const expected =
      '<span style="color:#fb6a6a;">Red</span> Normal <span style="color:#6eb2f7;">Blue</span>';
    expect(ansiHTML(input)).toEqual(expected);
  });
});

describe('convertLinksInHtml', () => {
  it('should convert file path with ANSI color codes to HTML', () => {
    const input1 = '[\u001b[36;1;4m/path/to/src/index.js\u001b[0m:4:1]\n';
    const expected1 =
      '[<span style="color:#6eecf7;font-weight:bold;text-decoration:underline;text-underline-offset:3px;"><a class="file-link" data-file="/path/to/src/index.js:4:1">/path/to/src/index.js:4:1</a></span>]\n';
    expect(convertLinksInHtml(ansiHTML(input1))).toEqual(expected1);

    const input2 = '[\u001b[36;1;4m/path/to/src/index.js:4:1\u001b[0m]\n';
    const expected2 =
      '[<span style="color:#6eecf7;font-weight:bold;text-decoration:underline;text-underline-offset:3px;"><a class="file-link" data-file="/path/to/src/index.js:4:1">/path/to/src/index.js:4:1</a></span>]\n';
    expect(convertLinksInHtml(ansiHTML(input2))).toEqual(expected2);
  });
});
