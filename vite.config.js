const path = require('path');

module.exports = async () => {
  const { defineConfig } = await import('vite');
  const { default: react } = await import('@vitejs/plugin-react');

  return defineConfig({
    plugins: [react()],
    root: '.',
    publicDir: 'public',
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          ws: true
        }
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    }
  });
};
