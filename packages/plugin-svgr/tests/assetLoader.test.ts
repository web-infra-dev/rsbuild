import { Buffer } from 'node:buffer';
import assetLoader from '../src/assetLoader';

describe('assetLoader', () => {
  const createContext = (limit: number) =>
    ({
      getOptions: () => ({
        limit,
        name: 'static/media/[name].[hash][ext]',
      }),
      rootContext: '/repo',
      resourcePath: '/repo/src/icon.svg',
      emitFile: () => {},
    }) as any;

  it('should encode string content as base64 data url when inlined', () => {
    const svg = '<svg><text>你好</text></svg>';
    const code = assetLoader.call(createContext(1024), svg) as string;

    const expected = `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
    expect(code).toBe(`export default ${JSON.stringify(expected)}`);
  });

  it('should encode buffer content as base64 data url when inlined', () => {
    const svg = '<svg><path d="M0 0h1v1H0z"/></svg>';
    const code = assetLoader.call(
      createContext(1024),
      Buffer.from(svg),
    ) as string;

    const expected = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    expect(code).toBe(`export default ${JSON.stringify(expected)}`);
  });

  it('should not inline string content when byte length exceeds limit', () => {
    const svg = '<svg><text>你好</text></svg>';
    const code = assetLoader.call(createContext(27), svg) as string;

    expect(Buffer.byteLength(svg, 'utf8')).toBeGreaterThan(27);
    expect(svg.length).toBeLessThanOrEqual(27);
    expect(code).not.toContain('data:image/svg+xml;base64');
  });
});
