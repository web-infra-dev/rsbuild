import { createUniBuilder } from '@rsbuild/uni-builder';

async function main() {
  const builder = await createUniBuilder({
    bundlerType: process.env.WEBPACK ? 'webpack' : 'rspack',
    config: {},
  });

  builder.build();
}

main();
