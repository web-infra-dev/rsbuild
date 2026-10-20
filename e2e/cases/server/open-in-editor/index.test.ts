import { expect, test } from '@e2e/helper';

test('should reject cross-origin editor requests', async ({ dev, request }) => {
  const { port } = await dev();
  const origin = `http://localhost:${port}`;

  const blockedHeaders: Record<string, string>[] = [
    { 'Sec-Fetch-Site': 'cross-site' },
    { 'Sec-Fetch-Site': 'same-site', Origin: origin },
    { Origin: 'http://untrusted.example' },
    { Origin: `http://localhost:${port + 1}` },
    { Origin: 'null' },
  ];
  for (const headers of blockedHeaders) {
    const response = await request.get(`${origin}/__open-in-editor`, {
      headers,
    });
    expect(response.status()).toBe(403);
    expect(await response.text()).toBe('Cross-origin request blocked');
  }
});

test('should preserve trusted and non-browser editor requests', async ({
  dev,
  request,
}) => {
  const { port } = await dev();
  const origin = `http://localhost:${port}`;

  const allowedHeaders: Record<string, string>[] = [
    { 'Sec-Fetch-Site': 'same-origin' },
    { 'Sec-Fetch-Site': 'none' },
    { Origin: origin },
    { Origin: `https://localhost:${port}` },
    {},
  ];
  for (const headers of allowedHeaders) {
    // Omit the file to exercise the editor handler without launching an editor.
    const response = await request.get(`${origin}/__open-in-editor`, {
      headers,
    });
    expect(response.status()).toBe(500);
    expect(await response.text()).toContain('required query param "file"');
  }
});
