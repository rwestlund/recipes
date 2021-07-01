//import cpy from 'rollup-plugin-cpy';
import html from '@open-wc/rollup-plugin-html';
import path from 'path';
import progress from 'rollup-plugin-progress';
import resolve from '@rollup/plugin-node-resolve';
import { generateSW } from 'rollup-plugin-workbox';
import { terser } from 'rollup-plugin-terser';

const c = [{
    input: path.resolve(__dirname, "index.html"),
    preserveEntrySignatures: false,
    treeshake: true,
    output: {
        format: "es",
        dir: "dist",
        entryFileNames: "[name]-[hash].js",
        plugins: [
            // Service worker with workbox.
            generateSW({
                globDirectory: "dist/",
                globPatterns: [
                    "index.html",
                    "recipes-app-*.js",
                ],
                globIgnores: [],
                globStrict: true,
                swDest: "dist/sw.js",
                skipWaiting: true,
                clientsClaim: true,
                cleanupOutdatedCaches: true,
                navigateFallback: "/index.html",
                navigateFallbackDenylist: [ /^\/api\// ],
                inlineWorkboxRuntime: true,
                runtimeCaching: [{
                    handler: "NetworkFirst",
                    // Cache API, but exclude non-cacheable or large responses.
                    urlPattern: /\/api\/(?!auth)/,
                }],
            }),
        ],
    },
    plugins: [
        // Resolve bare imports.
        resolve(),
        // Minify.
        terser({ output: { comments: false } }),
        // Use index.html as input.
        html({ minify: true }),
        // Copy assets.
        /*
        cpy([{
            files: [
                //path.resolve(__dirname, "browserconfig.xml"),
                //path.resolve(__dirname, "manifest.json"),
                //path.resolve(__dirname, "robots.txt"),
            ],
            dest: "dist",
        }]),
        */
        // Show a fancy progress line.
        progress(),
    ],
}];
export default c;
