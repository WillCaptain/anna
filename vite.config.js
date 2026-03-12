import {defineConfig} from 'vite';
import path from 'path';

export default defineConfig({
    root: '.',
    base: '/anna/',
    resolve: {
        alias: {
            // @anna 指向项目根目录，引用引擎代码如 @anna/core/base/graph.js
            '@anna': path.resolve(__dirname, '.'),
        },
    },
    server: {
        port: 8081,
        strictPort: true,
        open: true,
    },
});
