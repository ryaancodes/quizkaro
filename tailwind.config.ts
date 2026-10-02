import type { Config } from 'tailwindcss';
export default { content: ['./index.html', './src/**/*.ts'], darkMode: ['selector', '[data-t="dark"]'], theme: { extend: {} }, plugins: [] } satisfies Config;
