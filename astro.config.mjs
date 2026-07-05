// @ts-check
import { defineConfig } from 'astro/config';
import mermaid from 'astro-mermaid';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://miguoliang.com',
  integrations: [
    mermaid({
      theme: 'neutral',
      autoTheme: true,
      mermaidConfig: {
        flowchart: { curve: 'basis', padding: 12 },
        sequence: { diagramMarginX: 30, diagramMarginY: 8 },
      },
    }),
    sitemap(),
  ],
});