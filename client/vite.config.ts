import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// The client is a single-page app served by the Express server in production.
// In dev, `yarn start` runs Vite on :3000 and proxies /api to the API server on :8080.
export default defineConfig({
  plugins: [
    react(),
    // Import an SVG as a React component with `import Icon from './icon.svg?react'`.
    svgr(),
  ],
  build: {
    // Root package.json copies `client/build` into the server's static dir.
    outDir: 'build',
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
