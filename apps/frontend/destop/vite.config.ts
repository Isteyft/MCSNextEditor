import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [react()],
    css: {
        postcss: {
            plugins: [],
        },
    },
    server: {
        host: '127.0.0.1',
        port: 2084,
        strictPort: true,
    },
    clearScreen: false,
})
