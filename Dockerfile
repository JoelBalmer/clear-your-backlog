# ── Stage 1: build the Vite frontend ─────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Both names for the same public key — vite.config.ts accepts either.
# Railway passes all service Variables as Docker build args automatically,
# so whichever name you used in the Variables tab will be picked up.
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

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
