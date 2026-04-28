import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-mantine': [
            '@mantine/core',
            '@mantine/dates',
            '@mantine/form',
            '@mantine/hooks',
            '@mantine/modals',
            '@mantine/notifications',
          ],
          'vendor-icons': ['@tabler/icons-react'],
          'vendor-i18n': ['i18next', 'i18next-browser-languagedetector', 'react-i18next'],
          'vendor-misc': ['axios', 'qrcode.react', 'zustand'],
        },
      },
    },
  },
})
