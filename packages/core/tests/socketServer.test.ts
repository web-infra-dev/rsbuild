import type { WebSocket } from 'ws';
import { SocketServer, type ServerMessage } from '../src/server/socketServer';
import type { InternalContext, Rspack } from '../src/types';

const createSocket = (readyState = 1) => {
  const socket = {
    OPEN: 1,
    readyState,
    send: rstest.fn(),
  };
  return { socket: socket as unknown as WebSocket, send: socket.send };
};

const createServer = () => {
  const server = new SocketServer(
    {} as InternalContext,
    {},
    rstest.fn<() => Rspack.OutputFileSystem>(),
  );
  const first = createSocket();
  const second = createSocket();
  const other = createSocket();

  // Seed accepted connections to test routing independently of HTTP upgrades.
  server['socketsMap'].set('web', new Set([first.socket, second.socket]));
  server['socketsMap'].set('other', new Set([other.socket]));

  return { server, first, second, other };
};

const message: ServerMessage = {
  type: 'custom',
  data: {
    event: 'framework:revision',
    data: { sessionId: 'session', revision: 2 },
  },
};

test('should send a custom message only to the selected socket', () => {
  const { server, first, second, other } = createServer();

  server.sendMessage(message, first.socket);

  expect(first.send).toHaveBeenCalledExactlyOnceWith(JSON.stringify(message));
  expect(second.send).not.toHaveBeenCalled();
  expect(other.send).not.toHaveBeenCalled();
});

test('should broadcast only to sockets in the selected environment', () => {
  const { server, first, second, other } = createServer();

  server.sendMessage(message, 'web');

  expect(first.send).toHaveBeenCalledExactlyOnceWith(JSON.stringify(message));
  expect(second.send).toHaveBeenCalledExactlyOnceWith(JSON.stringify(message));
  expect(other.send).not.toHaveBeenCalled();
});

test('should serialize a broadcast once for all environments', () => {
  const { server, first, second, other } = createServer();
  const toJSON = rstest.fn(() => ({ revision: 2 }));
  const payload: ServerMessage = {
    type: 'custom',
    data: { event: 'framework:revision', data: { toJSON } },
  };

  server.sendMessage(payload);

  expect(toJSON).toHaveBeenCalledTimes(1);
  for (const { send } of [first, second, other]) {
    expect(send).toHaveBeenCalledExactlyOnceWith(
      '{"type":"custom","data":{"event":"framework:revision","data":{"revision":2}}}',
    );
  }
});

test('should not broadcast when the selected environment has no sockets', () => {
  const { server, first, second, other } = createServer();

  server.sendMessage(message, 'missing');

  for (const { send } of [first, second, other]) {
    expect(send).not.toHaveBeenCalled();
  }
});

test.each([0, 2, 3])(
  'should skip a socket with readyState %i for direct sends and broadcasts',
  (readyState) => {
    const { server, first, second } = createServer();
    const inactive = createSocket(readyState);
    server['socketsMap'].get('web')!.add(inactive.socket);

    expect(() => server.sendMessage(message, inactive.socket)).not.toThrow();
    server.sendMessage(message, 'web');

    expect(inactive.send).not.toHaveBeenCalled();
    expect(first.send).toHaveBeenCalledTimes(1);
    expect(second.send).toHaveBeenCalledTimes(1);
  },
);

test('should skip a socket that closes during message serialization', () => {
  const { server, first } = createServer();
  const payload: ServerMessage = {
    type: 'custom',
    data: {
      event: 'framework:revision',
      data: {
        toJSON() {
          Object.defineProperty(first.socket, 'readyState', { value: 3 });
          return { revision: 2 };
        },
      },
    },
  };

  expect(() => server.sendMessage(payload, first.socket)).not.toThrow();
  expect(first.send).not.toHaveBeenCalled();
});
