- **Type:** `{ key: string; cert: string }`
- **Default:** `undefined`

After configuring this option, you can enable HTTPS Server, and disabling the HTTP Server.

HTTP:

```bash
  > Local: http://localhost:8080/
  > Network: http://192.168.0.1:8080/
```

HTTPS:

```bash
  > Local: https://localhost:8080/
  > Network: https://192.168.0.1:8080/
```

#### Manually set the certificate

You can manually pass in the certificate and the private key required in the `server.https` option. This parameter will be directly passed to the createServer method of the https module in Node.js.

For details, please refer to [https.createServer](https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener).

```ts
import fs from 'fs';

export default {
  server: {
    https: {
      key: fs.readFileSync('certificates/private.pem'),
      cert: fs.readFileSync('certificates/public.pem'),
    },
  },
};
```
