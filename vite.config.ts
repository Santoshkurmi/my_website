import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { readFileSync } from 'node:fs';

// Injects config/site.json -> meta into index.html ({{title}}, {{description}}, ...)
const site = JSON.parse(readFileSync(new URL('./config/site.json', import.meta.url), 'utf8'));
const esc = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default defineConfig({
  // Relative base works on GitHub Pages (user or project site), Netlify, Vercel, or any folder.
  base: './',
  plugins: [
    solid(),
    {
      name: 'portfolio-meta',
      transformIndexHtml: {
        order: 'pre',
        handler: (html) => html.replace(/\{\{(\w+)\}\}/g, (_, k) => esc(site.meta[k] ?? '')),
      },
    },
  ],
  build: { target: 'es2020' },
});
