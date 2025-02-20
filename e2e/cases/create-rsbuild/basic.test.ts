import { rspackOnlyTest } from '@e2e/helper';
import { createAndValidate } from './helper';

rspackOnlyTest('should create vanilla project as expected', async () => {
  await createAndValidate(__dirname, 'vanilla');
});

rspackOnlyTest('should create vanilla-ts project as expected', async () => {
  await createAndValidate(__dirname, 'vanilla-ts');
});

rspackOnlyTest('should allow to create project in sub dir', async () => {
  await createAndValidate(__dirname, 'vanilla', {
    name: 'test-temp-dir/rsbuild-project',
  });
});

rspackOnlyTest('should allow to create project in relative dir', async () => {
  await createAndValidate(__dirname, 'vanilla', {
    name: './test-temp-relative-dir',
  });
});
