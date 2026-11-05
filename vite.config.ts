import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * `VITE_BASE` permite publicar no GitHub Pages em uma subpasta
 * (ex.: /MainCourse/) sem quebrar os caminhos dos ícones e do bundle.
 * O workflow de deploy define essa variável automaticamente.
 *
 * Em produção, o padrão é a subpasta do repositório; em desenvolvimento, a
 * raiz, para o `npm run dev` continuar em http://localhost:5173/.
 */
export default defineConfig(({ mode }) => ({
  base: process.env.VITE_BASE || (mode === 'production' ? '/MainCourse/' : '/'),
  plugins: [react()],
  build: {
    // O SDK do Firebase é grande; separar em um chunk próprio faz o app
    // abrir mais rápido nas próximas visitas (o SDK fica em cache).
    // O limite de 700 kB evita o aviso de chunk grande para o SDK.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'firebase'
          }
          if (id.includes('node_modules/react')) {
            return 'react'
          }
          return undefined
        },
      },
    },
  },
}))
