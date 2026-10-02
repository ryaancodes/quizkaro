import { defineConfig } from 'vitest/config';
export default defineConfig({ server: { proxy: { '/api': 'http://localhost:3000' } }, test: { include: ['tests/**/*.test.ts'] } });
