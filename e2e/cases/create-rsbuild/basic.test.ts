import { rspackTest } from '@e2e/helper';
import { createAndValidate } from './helper';

rspackTest('should create vanilla project as expected', async () => {
  await createAndValidate(import.meta.dirname, 'vanilla');
});

rspackTest('should create vanilla-ts project as expected', async () => {
  await createAndValidate(import.meta.dirname, 'vanilla-ts');
});

rspackTest('should allow to create project in sub dir', async () => {
  await createAndValidate(import.meta.dirname, 'vanilla', {
    name: 'test-temp-dir/rsbuild-project',
  });
});

rspackTest('should allow to create project in relative dir', async () => {
  await createAndValidate(import.meta.dirname, 'vanilla', {
    name: './test-temp-relative-dir',
  });
});
