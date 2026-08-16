// @ts-check
import { defineConfig, fontProviders } from 'astro/config'

import react from '@astrojs/react'

import tailwindcss from '@tailwindcss/vite'

import sitemap from '@astrojs/sitemap'

export default defineConfig({
  integrations: [
    react(),
    sitemap({
      changefreq: 'monthly',
    }),
  ],
  site: 'https://resources.andrsrxn.com',
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Instrument Sans',
      display: 'swap',
      subsets: ['latin'],
      styles: ['normal'],
      weights: ['400 700'],
      formats: ['woff2'],
      cssVariable: '--font-body',
    },
    {
      provider: fontProviders.google(),
      name: 'Instrument Serif',
      display: 'swap',
      subsets: ['latin'],
      weights: ['400'],
      styles: ['normal'],
      formats: ['woff2'],
      cssVariable: '--font-heading',
    },
  ],
})
