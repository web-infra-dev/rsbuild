import { describe, it, expect } from 'vitest';
import { Server } from '../src/build';
import { getPortSync } from '../src/build/server';

describe('test src/server.ts', () => {
  it('getPort()', async () => {
    expect(await Server.getPort(6273)).toEqual(6273);

    const { close } = await Server.createServer(8292);
    expect(await Server.getPort(8292)).not.toEqual(8292);
    await close();
  });

  it('getPortSync()', async () => {
    expect(getPortSync(3543)).toEqual(3543);

    const { close } = await Server.createServer(8262);
    expect(getPortSync(8262)).not.toEqual(8262);
    await close();
  });
});
