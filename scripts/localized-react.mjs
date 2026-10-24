import react from '@vitejs/plugin-react';

/** Keep the app's stateful JSX runtime in the source graph, shared with preference controls. */
export default function localizedReact() {
    return [react({ jsxImportSource: '@/lib/localizedReact' }), {
        name: 'sfd-shared-localization-runtime',
        enforce: 'post',
        config(config) {
            // plugin-react explicitly includes its JSX runtime. Vite 8's explicit includes
            // also prebundle excluded modules, which would duplicate the regional store.
            config.optimizeDeps ??= {};
            config.optimizeDeps.include = config.optimizeDeps.include?.filter(id => !id.startsWith('@/lib/localizedReact/'));
            config.optimizeDeps.exclude = [...new Set([...(config.optimizeDeps.exclude ?? []), '@/lib/localizedReact/jsx-runtime', '@/lib/localizedReact/jsx-dev-runtime'])];
        },
    }];
}
