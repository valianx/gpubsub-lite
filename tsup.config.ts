import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  target: 'node18',
  outDir: 'dist',
  external: [
    '@google-cloud/pubsub',
    'ioredis',
    'redis'
  ],
  banner: {
    js: '// @acme/pubsubx - TypeScript wrapper for Google Cloud Pub/Sub'
  }
});
