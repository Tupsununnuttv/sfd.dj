import { parseSync } from 'rolldown/utils';

/** Preserve user-written content while the React runtime localizes interface text. */
export default function protectUserContent() {
    return {
        name: 'sfd-original-user-content', enforce: 'pre',
        transform(source, id) {
            if (!id.replaceAll('\\', '/').includes('/resources/js/') || !id.endsWith('.tsx') || id.includes('localizedReact')) return;
            // Pure scenery and avatar art contain no interface copy; keep their SVG render path native.
            if (/\/(?:Components\/scene|lib\/art)\//.test(id.replaceAll('\\', '/')) || id.endsWith('/lib/animatedAvatars.tsx')) return { code: `/** @jsxImportSource react */\n${source}`, map: null };
            const { program } = parseSync(id, source, { lang: 'tsx' });
            const edits = [];
            let dialogs = false;
            const userText = /\b(?:user|u|member|friend|profile|p|m|message|song|s|current|room|r|host|dj|gift|event|e|announcement|ticket|conversation|group|g|line|l|t|item|entry)(?:\?\.|\.)(?:\w+(?:\?\.|\.))*?(?:name|username|title|body|bio|description|welcome_message|text|user|preview)\b/;
            function visit(node, parent) {
                if (!node || typeof node !== 'object') return;
                if (node.type === 'CallExpression' && node.arguments?.[0] && ((node.callee.type === 'Identifier' && ['confirm', 'prompt', 'alert'].includes(node.callee.name)) || (node.callee.type === 'MemberExpression' && node.callee.object?.name === 'window' && ['confirm', 'prompt', 'alert'].includes(node.callee.property?.name)))) {
                    const argument = node.arguments[0];
                    edits.push([argument.start, argument.end, `__sfdTranslate(${source.slice(argument.start, argument.end)})`]);
                    dialogs = true;
                }
                if (node.type === 'JSXExpressionContainer' && parent?.type !== 'JSXAttribute') {
                    const expression = source.slice(node.start + 1, node.end - 1);
                    const staticSiteContent = /\/Pages\/(?:Site\/|(?:Docs|PatchNotes)\.tsx$)/.test(id.replaceAll('\\', '/')) && /\b[psrg]\.(?:title|text|description|body)\b/.test(expression);
                    const identity = /(?:\?\.|\.)(?:name|username|body|bio|welcome_message|added_by|sender_name|display_name|who)\b/.test(expression);
                    if (node.expression?.type !== 'Literal' && !staticSiteContent && (userText.test(expression) || identity) && !/[`]|<[A-Za-z>]|=>|\bfunction\b/.test(expression)) {
                        edits.push([node.start, node.end, `{<__SfdOriginal>${source.slice(node.start, node.end)}</__SfdOriginal>}`]);
                        return;
                    }
                }
                for (const [key, value] of Object.entries(node)) if (!['comments', 'tokens'].includes(key)) {
                    if (Array.isArray(value)) value.forEach((child) => visit(child, node));
                    else if (value && typeof value === 'object') visit(value, node);
                }
            }
            visit(program);
            if (!edits.length) return;
            for (const [start, end, replacement] of edits.sort((a, b) => b[0] - a[0])) source = source.slice(0, start) + replacement + source.slice(end);
            return { code: `import { OriginalText as __SfdOriginal } from '@/lib/localizedReact/jsx-runtime';\n${dialogs ? "import { translate as __sfdTranslate } from '@/lib/regional';\n" : ''}${source}`, map: null };
        },
    };
}
