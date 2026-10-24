import fs from 'node:fs';
import path from 'node:path';
import { parseSync } from 'rolldown/utils';

const messages = new Map();
function add(text, file) {
    text = text.replace(/\s+/g, ' ').trim();
    if (!/[A-Za-z]{2}/.test(text) || /^[a-z0-9_./:@#%!-]+$/.test(text) || text.length > 1000 || /(?:className|#[a-f0-9]{3,8}|https?:\/\/|^import |^M\d)/.test(text)) return;
    if (!messages.has(text)) messages.set(text, []);
    if (!messages.get(text).includes(file)) messages.get(text).push(file);
}
function visit(node, file) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'JSXText') add(node.value, file);
    if (node.type === 'Literal' && typeof node.value === 'string') add(node.value, file);
    if (node.type === 'TemplateLiteral') add(node.quasis.map((part, index) => part.value.cooked + (index < node.expressions.length ? `{${index}}` : '')).join(''), file);
    for (const [key, value] of Object.entries(node)) if (!['comments', 'tokens'].includes(key)) {
        if (Array.isArray(value)) value.forEach((child) => visit(child, file));
        else if (value && typeof value === 'object') visit(value, file);
    }
}
function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory() && !['locales', 'art'].includes(entry.name)) walk(file);
        else if (entry.isFile() && /\.(tsx|ts)$/.test(file) && !/\.d\.ts$|regional\.ts/.test(file)) {
            const result = parseSync(file, fs.readFileSync(file, 'utf8'), { lang: file.endsWith('.tsx') ? 'tsx' : 'ts' });
            visit(result.program, file.replaceAll('\\', '/'));
        }
    }
}
walk('resources/js');
fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync('tmp/ui-messages.json', JSON.stringify(Object.fromEntries([...messages].sort(([a], [b]) => a.localeCompare(b))), null, 2));
console.log(`${messages.size} distinct messages; ${[...messages.keys()].reduce((total, value) => total + value.split(' ').length, 0)} source words`);
