import { expect, test } from '@e2e/helper';

test('should assign unique compact-hashed IDs to modern-module worker facades', async ({
  page,
  buildPreview,
}) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const result = await buildPreview();
  const stats = result.stats!.toJson({
    all: false,
    chunks: true,
    chunkModules: true,
    ids: true,
  });
  const chunks = stats.chunks!;
  const facades = chunks.filter(
    (chunk) => chunk.entry && !chunk.initial && chunk.modules?.length === 0,
  );

  expect(facades).toHaveLength(14);
  for (const chunk of facades) {
    expect(chunk.names).toEqual([]);
    expect(chunk.id).not.toBeNull();
    expect(chunk.id).toBeDefined();
  }
  expect(new Set(chunks.map((chunk) => chunk.id)).size).toBe(chunks.length);
  expect(
    chunks.filter(
      (chunk) => !chunk.entry && !chunk.initial && chunk.modules?.length === 0,
    ),
  ).toHaveLength(0);

  await expect(page.locator('#workers')).toHaveText(
    Array.from({ length: 14 }, (_, index) => index).join(','),
  );
  expect(pageErrors).toEqual([]);
});
