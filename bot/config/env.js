// Reads the .env files before anything else looks at process.env. A variable that is already set (a real environment variable) always wins; after that the first file
// to name it does: the bot's own bot/.env, then the website's .env one folder up (the bot has always read that one, so nothing has to be copied).
import { existsSync } from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

for (const file of ['../.env', '../../.env']) {
    const path = fileURLToPath(new URL(file, import.meta.url));

    if (existsSync(path)) {
        process.loadEnvFile(path);
    }
}
