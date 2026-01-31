import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Écouter sur toutes les interfaces (nécessaire pour Docker)
    host: '0.0.0.0',
    port: 5173,
    // Configuration HMR pour Docker
    hmr: {
      // Utiliser le même port pour le WebSocket
      port: 5173,
      // Utiliser le host client (localhost) pour la connexion WebSocket
      clientPort: 5173,
      // Timeout plus long pour les connexions lentes
      timeout: 120000,
    },
    // Configuration du watcher pour Docker (polling au lieu d'inotify)
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
})
