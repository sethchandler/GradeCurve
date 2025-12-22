import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // Use GitHub Pages base path only in production mode for GitHub deployment
  const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';

  return {
    base: isGitHubPages ? '/GradeCurve/' : '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      '__BUILD_TIMESTAMP__': JSON.stringify(new Date().toISOString()),
      '__APP_VERSION__': JSON.stringify('1.2.0')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
