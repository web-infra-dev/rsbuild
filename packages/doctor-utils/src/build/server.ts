import connect from 'connect';
import http from 'http';
import os from 'os';
import gp from 'get-port';
import { execSync } from 'child_process';
import { Thirdparty } from '@rsbuild/doctor-types';
import { random } from '../common/algorithm';

export const defaultPort = random(3000, 8999);

export async function getPort(expectPort: number) {
  return gp({ port: expectPort });
}

export const createGetPortSyncFunctionString = (expectPort: number) =>
  `
(() => {
const net = require('net');

function getPort(expectPort) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(expectPort, () => {
      const { port } = server.address();
      server.close(() => {
        resolve(port);
      });
    });
  });
}

async function getAvailablePort(expectPort) {
  let port = expectPort;
  while (true) {
    try {
      const res = await getPort(port);
      return res;
    } catch (error) {
      port += Math.floor(Math.random() * 100 + 1);
    }
  }
}

getAvailablePort(${expectPort}).then(port => process.stdout.write(port.toString()));
})();
`.trim();

export function getPortSync(expectPort: number): number | never {
  const statement =
    os.EOL === '\n'
      ? createGetPortSyncFunctionString(expectPort)
      : createGetPortSyncFunctionString(expectPort).replace(/\n/g, '');

  const port = execSync(`node -e "${statement}"`, { encoding: 'utf-8' });

  return Number(port);
}

export function createApp() {
  return connect();
}

export async function createServer(port: number): Promise<{
  app: Thirdparty.connect.Server;
  server: http.Server;
  port: number;
  close(): Promise<void> | never;
}> {
  const app = createApp();
  const server = http.createServer(app);

  const res = {
    app,
    server,
    port,
    close() {
      return new Promise<void>((resolve, reject) => {
        if ('closeAllConnections' in server) {
          (server as any).closeAllConnections();
        }
        if ('closeIdleConnections' in server) {
          (server as any).closeIdleConnections();
        }

        server.close((err) => {
          if (err) reject(err);
          resolve();
        });
      });
    },
  };

  return new Promise<typeof res>((resolve) => {
    server.listen(port, () => {
      resolve(res);
    });
  });
}
