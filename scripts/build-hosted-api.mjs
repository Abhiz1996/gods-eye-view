import { build } from 'esbuild';

// The proxy definitions share a file with Vite's configuration. Replace only
// build-tool imports while bundling the server; providers and their validation
// remain the same code used locally. Hosted environment values already come
// from the platform and must never be read from local .env files.
await build({
  entryPoints: ['server/hosted-api.js'],
  outfile: '.hosted-api.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  banner: { js: "import { createRequire as createNodeRequire } from 'node:module'; const require = createNodeRequire(import.meta.url);" },
  plugins: [{
    name: 'exclude-build-tools-from-hosted-runtime',
    setup(builder) {
      builder.onResolve({ filter: /^(vite|vite-plugin-cesium)$/ }, args => ({
        path: args.path, namespace: 'hosted-build-shim',
      }));
      builder.onLoad({ filter: /.*/, namespace: 'hosted-build-shim' }, args => ({
        contents: args.path === 'vite'
          ? 'export const defineConfig = config => config; export const loadEnv = () => ({});'
          : "export default () => ({ name: 'vite-plugin-cesium' });",
        loader: 'js',
      }));
    },
  }],
});
