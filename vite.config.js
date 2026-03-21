import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/historical-option-chain/',
  plugins: [react()],
})

