import { config } from 'dotenv';
import { Pool } from 'pg';
import { fileURLToPath } from 'node:url';

config({ path: fileURLToPath(new URL('../../../../.env', import.meta.url)) });

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
const ssl = process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : undefined;

export const pool = new Pool({
    ...(connectionString
        ? { connectionString }
        : {
            host: process.env.DB_HOST ?? process.env.PGHOST ?? '127.0.0.1',
            port: Number(process.env.DB_PORT ?? process.env.PGPORT ?? 5432),
            database: process.env.DB_DATABASE ?? process.env.PGDATABASE,
            user: process.env.DB_USERNAME ?? process.env.PGUSER,
            password: process.env.DB_PASSWORD ?? process.env.PGPASSWORD,
        }),
    ssl: connectionString ? undefined : ssl,
    max: Number(process.env.DB_POOL_MAX ?? 5),
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
});

pool.on('error', (error: Error) => {
    console.error('Unexpected PostgreSQL pool error', error);
});