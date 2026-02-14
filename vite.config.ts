import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
    root: path.resolve(__dirname),
    plugins: [react()],
    clearScreen: false,
    server: {
        port: 5173,
        strictPort: true,
        fs: {
            allow: [path.resolve(__dirname)],
        },
    },
    envPrefix: ['VITE_', 'TAURI_'],
})
