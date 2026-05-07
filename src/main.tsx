import React from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { ThemeProvider } from './contexts/ThemeContext';
import App from './App';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  document.body.style.cssText = 'font-family:monospace;padding:24px;color:#c00;background:#fff';
  document.body.textContent =
    'Config error: VITE_CLERK_PUBLISHABLE_KEY was empty at Docker build time. ' +
    'Add it to Railway Variables (same value as NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) and redeploy.';
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/sign-in">
        <App />
      </ClerkProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
