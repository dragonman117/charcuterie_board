import { defineConfig } from 'astro/config';

const basePath = process.env.BASE_PATH ?? '/';
const site = process.env.SITE ?? 'https://localhost';

export default defineConfig({
  output: 'static',
  base: basePath,
  site,
  trailingSlash: 'ignore',
});