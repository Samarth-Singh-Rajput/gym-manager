
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Gym Manager',
        short_name: 'Gym Manager',
        description: 'Gym membership management app',
        theme_color: '#194532',
        background_color: '#194532',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/gym-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/gym-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})
