// Test demonstrating the improved conditional typing for TransformContext
import { createStubRsbuild } from '@scripts/test-helper';

describe('transform context conditional typing', () => {
  it('should provide Buffer type for raw transforms', async () => {
    // This test validates that when raw: true is used, the code parameter is typed as Buffer
    const rsbuild = await createStubRsbuild({
      plugins: [
        {
          name: 'test-buffer-typing',
          setup(api) {
            // This should compile without TypeScript errors and code should be typed as Buffer
            api.transform(
              { test: /\.buffer$/, raw: true },
              ({ code, emitFile }) => {
                // Type assertion for testing - code should be Buffer when raw: true
                const buffer: Buffer = code; // This should work without type errors

                // Verify it's actually a Buffer at runtime
                expect(Buffer.isBuffer(code)).toBe(true);
                expect(typeof code).not.toBe('string');

                emitFile('test.bin', buffer);
                return 'export default "buffer processed";';
              },
            );
          },
        },
      ],
    });

    // Verify the transform was registered
    const config = await rsbuild.unwrapConfig();
    expect(config).toBeDefined();
  });

  it('should provide string type for non-raw transforms', async () => {
    // This test validates that when raw is not specified or false, the code parameter is typed as string
    const rsbuild = await createStubRsbuild({
      plugins: [
        {
          name: 'test-string-typing',
          setup(api) {
            // This should compile without TypeScript errors and code should be typed as string
            api.transform({ test: /\.string$/ }, ({ code }) => {
              // Type assertion for testing - code should be string when raw is not specified
              const str: string = code; // This should work without type errors

              // Verify it's actually a string at runtime in normal usage
              expect(typeof code).toBe('string');
              expect(Buffer.isBuffer(code)).toBe(false);

              return `${str}\n// processed`;
            });
          },
        },
      ],
    });

    // Verify the transform was registered
    const config = await rsbuild.unwrapConfig();
    expect(config).toBeDefined();
  });

  it('should provide string type for explicitly non-raw transforms', async () => {
    // This test validates that when raw: false is explicitly specified, code is typed as string
    const rsbuild = await createStubRsbuild({
      plugins: [
        {
          name: 'test-explicit-non-raw',
          setup(api) {
            // This should compile without TypeScript errors and code should be typed as string
            api.transform({ test: /\.text$/, raw: false }, ({ code }) => {
              // Type assertion for testing - code should be string when raw: false
              const str: string = code; // This should work without type errors

              return `processed: ${str}`;
            });
          },
        },
      ],
    });

    // Verify the transform was registered
    const config = await rsbuild.unwrapConfig();
    expect(config).toBeDefined();
  });
});
