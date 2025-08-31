import { createStubRsbuild } from '@scripts/test-helper';

describe('transform raw loader', () => {
  it('should handle Buffer input correctly for raw transforms', async () => {
    // This test verifies the typing works correctly
    const rsbuild = await createStubRsbuild({
      plugins: [
        {
          name: 'test-raw-transform',
          setup(api) {
            api.transform({ test: /\.node$/, raw: true }, ({ code }) => {
              // The key test is that TypeScript allows this code to compile
              // when TransformContext.code is typed as string | Buffer
              const isBuffer = Buffer.isBuffer(code);
              const isString = typeof code === 'string';

              // This should work with both Buffer and string
              return `export default "transformed-${isBuffer ? 'buffer' : isString ? 'string' : 'unknown'}";`;
            });
          },
        },
      ],
      rsbuildConfig: {
        output: {
          target: 'node',
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    // Verify that the raw loader is being used
    const rules = config.module?.rules || [];
    const nodeRule = rules.find((rule: any) =>
      rule.test?.toString().includes('\\.node'),
    );

    expect(nodeRule).toBeDefined();
    expect(nodeRule.use[0].loader).toContain('transformRawLoader');
  });

  it('should handle string input correctly for non-raw transforms', async () => {
    // This test verifies that the typing works for non-raw transforms too
    const rsbuild = await createStubRsbuild({
      plugins: [
        {
          name: 'test-string-transform',
          setup(api) {
            api.transform({ test: /\.test\.js$/ }, ({ code }) => {
              // The key test is that TypeScript allows this code to compile
              // when TransformContext.code is typed as string | Buffer
              const isBuffer = Buffer.isBuffer(code);
              const isString = typeof code === 'string';

              return `export default "transformed-${isString ? 'string' : isBuffer ? 'buffer' : 'unknown'}";`;
            });
          },
        },
      ],
    });

    const config = await rsbuild.unwrapConfig();

    // Verify that the regular loader is being used (not raw)
    const rules = config.module?.rules || [];
    const testRule = rules.find((rule: any) =>
      rule.test?.toString().includes('\\.test\\.js'),
    );

    expect(testRule).toBeDefined();
    expect(testRule.use[0].loader).toContain('transformLoader');
    expect(testRule.use[0].loader).not.toContain('transformRawLoader');
  });

  it('should allow the nodeAddons plugin pattern to work with Buffer', () => {
    // This test specifically validates the use case from the nodeAddons plugin
    // where raw transforms expect Buffer input
    const mockCode = Buffer.from('test binary data');
    const emitFileCalls: Array<{ name: string; content: Buffer }> = [];

    // Simulate the transform handler from nodeAddons plugin
    const transformHandler = ({
      code,
      emitFile,
    }: {
      code: string | Buffer;
      emitFile: (name: string, content: Buffer) => void;
    }) => {
      // This should work without type errors now that code can be Buffer
      emitFile('test.node', code as Buffer);

      return `
try {
const path = require("path");
process.dlopen(module, path.join(__dirname, "test.node"));
} catch (error) {
throw new Error('Failed to load Node.js addon: "test.node"\\n' + error);
}
`;
    };

    // This should not throw TypeScript errors
    const result = transformHandler({
      code: mockCode,
      emitFile: (name, content) => {
        emitFileCalls.push({ name, content });
      },
    });

    expect(emitFileCalls).toHaveLength(1);
    expect(emitFileCalls[0].name).toBe('test.node');
    expect(emitFileCalls[0].content).toBe(mockCode);
    expect(result).toContain('process.dlopen');
  });
});
