import { createServer } from 'node:http';
import { constants, gunzipSync } from 'node:zlib';
import { gzipMiddleware } from '../src/server/gzipMiddleware';
import type { Server, ServerResponse } from 'node:http';

type FlushableResponse = ServerResponse & { flush?: () => void };

const closeServer = (server: Server) => {
  return new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
};

const listen = (server: Server) => {
  return new Promise<number>((resolve) => {
    server.listen(0, () => {
      const address = server.address();
      if (typeof address === 'object' && address) {
        resolve(address.port);
      }
    });
  });
};

test('should support raw header arrays passed to writeHead', async () => {
  const server = createServer((req, res) => {
    gzipMiddleware()(req, res, () => {
      res.writeHead(200, 'OK', [
        'Content-Type',
        'text/plain; charset=utf-8',
        'X-Test-Header',
        'ok',
      ]);
      res.end('hello '.repeat(300));
    });
  });

  const port = await listen(server);

  try {
    const response = await fetch(`http://localhost:${port}`, {
      headers: {
        'accept-encoding': 'gzip',
      },
    });
    await response.text();

    expect(response.headers.get('content-type')).toBe(
      'text/plain; charset=utf-8',
    );
    expect(response.headers.get('x-test-header')).toBe('ok');
    expect(response.headers.get('content-encoding')).toBe('gzip');
    expect(response.headers.get('0')).toBeNull();
    expect(response.headers.get('1')).toBeNull();
  } finally {
    await closeServer(server);
  }
});

test('should preserve set-cookie entries from raw header arrays', async () => {
  const server = createServer((req, res) => {
    gzipMiddleware()(req, res, () => {
      res.writeHead(200, 'OK', [
        'Content-Type',
        'text/plain; charset=utf-8',
        'Set-Cookie',
        'a=1',
        'Set-Cookie',
        'b=2',
      ]);
      res.end('hello '.repeat(300));
    });
  });

  const port = await listen(server);

  try {
    const response = await fetch(`http://localhost:${port}`, {
      headers: {
        'accept-encoding': 'gzip',
      },
    });
    await response.text();

    expect(response.headers.getSetCookie()).toEqual(['a=1', 'b=2']);
  } finally {
    await closeServer(server);
  }
});

test('should remove writeHead compression headers when response is gzipped', async () => {
  const server = createServer((req, res) => {
    gzipMiddleware()(req, res, () => {
      res.writeHead(200, 'OK', [
        'Content-Type',
        'text/plain; charset=utf-8',
        'Content-Length',
        '1800',
      ]);
      res.end('hello '.repeat(300));
    });
  });

  const port = await listen(server);

  try {
    const response = await fetch(`http://localhost:${port}`, {
      headers: {
        'accept-encoding': 'gzip',
      },
    });
    await response.text();

    expect(response.headers.get('content-encoding')).toBe('gzip');
    expect(response.headers.get('content-length')).toBeNull();
  } finally {
    await closeServer(server);
  }
});

test('should not compress responses with writeHead content-encoding', async () => {
  const server = createServer((req, res) => {
    gzipMiddleware()(req, res, () => {
      res.writeHead(200, 'OK', [
        'Content-Type',
        'text/plain; charset=utf-8',
        'Content-Encoding',
        'identity',
      ]);
      res.end('hello '.repeat(300));
    });
  });

  const port = await listen(server);

  try {
    const response = await fetch(`http://localhost:${port}`, {
      headers: {
        'accept-encoding': 'gzip',
      },
    });
    await response.text();

    expect(response.headers.get('content-encoding')).toBe('identity');
  } finally {
    await closeServer(server);
  }
});

test('should not compress responses without content-type', async () => {
  const server = createServer((req, res) => {
    gzipMiddleware()(req, res, () => {
      res.end('hello '.repeat(300));
    });
  });

  const port = await listen(server);

  try {
    const response = await fetch(`http://localhost:${port}`, {
      headers: {
        'accept-encoding': 'gzip',
      },
    });
    const text = await response.text();

    expect(response.headers.get('content-encoding')).toBeNull();
    expect(response.headers.get('content-type')).toBeNull();
    expect(text).toBe('hello '.repeat(300));
  } finally {
    await closeServer(server);
  }
});

test('should not compress text/event-stream responses', async () => {
  const server = createServer((req, res) => {
    gzipMiddleware()(req, res, () => {
      res.writeHead(200, 'OK', [
        'Content-Type',
        'text/event-stream; charset=utf-8',
        'Cache-Control',
        'no-cache',
      ]);
      res.end('data: hello\n\n');
    });
  });

  const port = await listen(server);

  try {
    const response = await fetch(`http://localhost:${port}`, {
      headers: {
        'accept-encoding': 'gzip',
      },
    });
    const text = await response.text();

    expect(response.headers.get('content-encoding')).toBeNull();
    expect(response.headers.get('content-type')).toBe(
      'text/event-stream; charset=utf-8',
    );
    expect(text).toBe('data: hello\n\n');
  } finally {
    await closeServer(server);
  }
});

test.each([
  { contentType: 'text/html', encoding: 'gzip' },
  { contentType: 'text/event-stream', encoding: null },
])(
  'should preserve flush hooks before and after writing $contentType responses',
  async ({ contentType, encoding }) => {
    let headersSentBeforeWrite = false;
    let response: ServerResponse | undefined;
    const chunks: Buffer[] = [];
    const flush = rstest.fn(() => Buffer.concat(chunks));
    const body = 'hello '.repeat(300);
    const server = createServer((req, res: FlushableResponse) => {
      response = res;
      res.flush = flush;
      const write = res.write.bind(res);
      // Capture what earlier middleware has received when its flush method runs.
      res.write = (chunk) => {
        chunks.push(Buffer.from(chunk));
        return write(chunk);
      };

      gzipMiddleware()(req, res, () => {
        res.flush?.();
        headersSentBeforeWrite = res.headersSent;
        res.setHeader('Content-Type', contentType);
        res.write(body);
        res.flush?.();
        res.flush?.();
        res.end('done');
      });
    });

    const port = await listen(server);

    try {
      const result = await fetch(`http://localhost:${port}`, {
        headers: { 'accept-encoding': 'gzip' },
      });

      expect(await result.text()).toBe(`${body}done`);
      expect(result.headers.get('content-encoding')).toBe(encoding);
      expect(headersSentBeforeWrite).toBe(false);
      expect(flush).toHaveBeenCalledTimes(3);
      for (const receiver of flush.mock.contexts) {
        expect(receiver).toBe(response);
      }
      const flushed = flush.mock.results[1].value;
      const decoded = encoding
        ? gunzipSync(flushed, { finishFlush: constants.Z_SYNC_FLUSH })
        : flushed;
      expect(decoded.toString()).toBe(body);
    } finally {
      await closeServer(server);
    }
  },
);
