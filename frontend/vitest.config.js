/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// https://vitest.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js', // Optional: if you need global setup (e.g., jest-dom matchers)
    css: false, // or true if you want to test styles, might need CSS preprocessor setup
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: [
        'src/main.jsx', // Entry point
        'src/**/index.js', // Barrel files
        'src/**/index.jsx',
        'src/vite-env.d.ts',
        'src/test/setup.js', // Test setup file
        'src/components/ui', // Assuming shadcn/ui components are pre-tested
        'src/tools', // Utility scripts, not components
        'src/hooks/useTheme.js', // Example if some hooks are too simple or covered elsewhere
      ],
      all: true, // Measure coverage for all files, not just tested ones
      lines: 90,
      functions: 90,
      branches: 90,
      statements: 90,
    },
  },
  // To handle path aliases like @/components/*
  resolve: {
    alias: {
      '@': '/src', // Adjust if your alias points elsewhere, e.g. path.resolve(__dirname, './src')
    },
  },
});
[end of frontend/vitest.config.js]
