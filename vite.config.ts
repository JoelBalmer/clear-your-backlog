/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Merge .env.* files (loadEnv) with process.env (Vercel build env).
  // Allows aliasing the Clerk integration's NEXT_PUBLIC_* var to a VITE_* one
  // without provisioning a separate Vercel env var.
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
  const clerkPubKey =
    env.VITE_CLERK_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

  return {
    plugins: [react(), legacy()],
    define: {
      'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(clerkPubKey),
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
    },
  };
});
