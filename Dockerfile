# ── Stage 1: build the Vite frontend ─────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_CLERK_PUBLISHABLE_KEY is a public key that gets baked into the JS
# bundle at build time. Set it as a variable in Railway's dashboard and
# Railway will pass it here automatically as a build arg.
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

RUN npm run build

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

# Install production + server deps (tsx is listed as a dependency so it lands
# here; omit dev-only tooling like cypress/eslint/vitest/drizzle-kit).
COPY package*.json ./
RUN npm ci --omit=dev

# Built frontend assets from stage 1
COPY --from=builder /app/dist ./dist

# API source + server entry (tsx compiles TypeScript at startup — fast enough
# for a personal project and avoids a separate TS compilation step).
COPY api ./api
COPY server.ts ./
COPY tsconfig.json tsconfig.api.json ./

EXPOSE 3000

ENV NODE_ENV=production

CMD ["./node_modules/.bin/tsx", "server.ts"]
