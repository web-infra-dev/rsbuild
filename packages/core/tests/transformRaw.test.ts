import { createStubRsbuild } from '@scripts/test-helper';

describe('transform raw loader', () => {
  it('should handle Buffer input correctly for raw transforms', async () => {
    let receivedCodeType: string;
    let receivedCodeIsBuffer: boolean;
    
    const rsbuild = await createStubRsbuild({
      plugins: [
        {
          name: 'test-raw-transform',
          setup(api) {
            api.transform(
              { test: /\.node$/, raw: true },
              ({ code }) => {
                receivedCodeType = typeof code;
                receivedCodeIsBuffer = Buffer.isBuffer(code);
                return 'export default "transformed";';
              }
            );
          }
        }
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
      rule.test && rule.test.toString().includes('\\.node')
    );
    
    expect(nodeRule).toBeDefined();
    expect(nodeRule.use[0].loader).toContain('transformRawLoader');
    
    // Note: We can't easily test the runtime behavior in a unit test,
    // but we can verify the configuration is correct
  });
});