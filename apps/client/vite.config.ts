import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig( ( { mode } ) => {
    const env = loadEnv( mode, process.cwd(), '' );

    return {
        plugins: [ tailwindcss(), reactRouter() ],
        server: {
            host: true,
            port: Number( env.CLIENT_PORT || 5173 ),
            strictPort: true,
        },
        resolve: {
            tsconfigPaths: true,
        },
        optimizeDeps: {
            exclude: [ '@voidbrawl/shared' ],
        },
    };
} );
