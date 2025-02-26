import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should define vars in production mode correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const file = await rsbuild.getIndexFile();
  expect(file.content).toContain(
    'console.log("import.meta.env.MODE","production")',
  );
  expect(file.content).toContain(
    'console.log("process.env.NODE_ENV","production")',
  );
  expect(file.content).not.toContain('console.log("import.meta.env.DEV")');
  expect(file.content).toContain('console.log("import.meta.env.PROD")');
});

test('should define vars in development mode correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      mode: 'development',
    },
  });

  const file = await rsbuild.getIndexFile();
  expect(file.content).toContain(
    'console.log(\'import.meta.env.MODE\', "development");',
  );
  expect(file.content).toContain(
    'console.log(\'process.env.NODE_ENV\', "development")',
  );
  expect(file.content).toContain("console.log('import.meta.env.DEV');");
  expect(file.content).not.toContain("console.log('import.meta.env.PROD');");
});

test('should define vars in none mode correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      mode: 'none',
    },
  });

  const file = await rsbuild.getIndexFile();
  expect(file.content).toContain(
    'console.log(\'import.meta.env.MODE\', "none");',
  );
  expect(file.content).toContain(
    "console.log('process.env.NODE_ENV', process.env.NODE_ENV)",
  );
  expect(file.content).not.toContain("console.log('import.meta.env.DEV');");
  expect(file.content).not.toContain("console.log('import.meta.env.PROD');");
});
