#!/usr/bin/env node
/**
 * First-time setup for local development.
 * Run via: npm run setup
 *
 * What it does:
 *   1. npm install
 *   2. Creates .env.development.local (via `vercel env pull` if available,
 *      otherwise copies .env.example so you can fill in values manually)
 *   3. Prints next steps
 */

import { existsSync, copyFileSync } from 'fs';
import { execSync } from 'child_process';

const green  = (s) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const bold   = (s) => `\x1b[1m${s}\x1b[0m`;

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', ...opts });
}

// ── 1. Dependencies ──────────────────────────────────────────────────────────────────────────────────
const dep_msg = bold('\n▸ Installing dependencies…');
console.log(dep_msg);
run('npm install');
console.log(green('  ✓ Dependencies installed'));

// ── 2. Environment file ─────────────────────────────────────────────────────────────────────────────────────
const ENV_FILE = '.env.development.local';

if (existsSync(ENV_FILE)) {
  console.log(green(`\n▸ ${ENV_FILE} already exists — skipping env setup`));
} else {
  console.log(bold(`\n▸ Creating ${ENV_FILE}…`));

  // Try Vercel CLI first (pulls real secrets automatically)
  let pulled = false;
  try {
    execSync('vercel --version', { stdio: 'ignore' });
    console.log('  Vercel CLI found, running: vercel env pull');
    run(`vercel env pull ${ENV_FILE}`);
    pulled = true;
    console.log(green(`  ✓ Env vars pulled from Vercel → ${ENV_FILE}`));
  } catch {
    // Vercel CLI not installed or project not linked — fall back to example file
  }

  if (!pulled) {
    copyFileSync('.env.example', ENV_FILE);
    console.log(yellow(`  ⚠  Vercel CLI not found. Copied .env.example → ${ENV_FILE}`));
    console.log(yellow(`     Open ${ENV_FILE} and fill in the required values before running the app:`));
    console.log(yellow('       • DATABASE_URL / DATABASE_URL_UNPOOLED  (Neon)'));
    console.log(yellow('       • NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY'));
    console.log(yellow('       • TWITCH_CLIENT_ID + TWITCH_CLIENT_SECRET'));
  }
}

// ── 3. Done ─────────────────────────────────────────────────────────────────────────────────────────────
const done_msg = bold('\n✓ Setup complete!\n');
console.log(done_msg);
console.log('  Start the dev server (Vite + API):');
console.log(bold('    npm start\n'));
console.log('  Or run them separately:');
console.log('    npm run dev       # Vite frontend only (port 5173)');
console.log('    npm run dev:api   # Express API only   (port 3000)\n');
