import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';
import app from './app.js';

let server: ReturnType<typeof app.listen>;
let baseUrl: string;

before(async () => {
    await new Promise<void>((resolve) => {
        server = app.listen(0, '127.0.0.1', () => {
            const address = server.address() as AddressInfo;
            baseUrl = `http://127.0.0.1:${address.port}`;
            resolve();
        });
    });
});

after(async () => {
    await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    });
});

test('health endpoint confirms the API is running without database access', async () => {
    const response = await fetch(`${baseUrl}/api/node/health`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
});