import fs from 'node:fs';
import path from 'node:path';
import type { ServerConfig } from '@rsbuild/core';
import selfsigned from 'selfsigned';

type HttpsConfig = ServerConfig['https'];

export const resolveHttpsConfig = (
  config: HttpsConfig,
): {
  key: NonNullable<HttpsConfig>['key'];
  cert: NonNullable<HttpsConfig>['cert'];
} => {
  const { key, cert } = config ?? {};

  if (key && cert) {
    return { key, cert };
  }

  const certPath = path.join(__dirname, 'fake-cert.pem');
  if (fs.existsSync(certPath)) {
    const stats = fs.statSync(certPath);
    // Default validity period is 30 days
    if (stats.mtimeMs <= Date.now() - 1000 * 60 * 60 * 24 * 30) {
      const content = fs.readFileSync(certPath, { encoding: 'utf-8' });
      return {
        key: content,
        cert: content,
      };
    }
  }

  const pem = selfsigned.generate(
    [{ name: 'commonName', value: 'localhost' }],
    {
      days: 30,
      keySize: 2048,
    },
  );

  const content = pem.private + pem.cert;
  fs.writeFileSync(certPath, content, { encoding: 'utf-8' });
  return {
    key: content,
    cert: content,
  };
};
