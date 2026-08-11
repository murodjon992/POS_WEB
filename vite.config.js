import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '127.0.0.1', // ::1 (IPv6) o'rniga aniq 127.0.0.1 (IPv4) ishlatish
    port: 3000,        // Muammoli 5173 o'rniga 3000 portni tanlash
  },
})