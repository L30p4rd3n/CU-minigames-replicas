import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        lockpick: 'lockpick.html',
        shrapnel: 'shrapnel.html'
      },
    },
  },
});