# Image for the Pi preview environments (docker-compose.preview.yml).
# Production does not use it: Vercel builds and serves the site on its own.
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-slim AS build
WORKDIR /app
# NEXT_PUBLIC_* values are inlined into the bundle at build time, so they are build args.
ARG NEXT_PUBLIC_WIX_CLIENT_ID
ENV NEXT_PUBLIC_WIX_CLIENT_ID=$NEXT_PUBLIC_WIX_CLIENT_ID \
    NEXT_OUTPUT=standalone \
    NOINDEX=1 \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Standalone output keeps each preview image small: the Pi hosts one per branch.
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
