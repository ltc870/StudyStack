# ---- Stage 1: build the Angular app ----
FROM node:24-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . ./
RUN npx ng build --configuration production

# ---- Stage 2: serve it with Caddy ----
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist/frontend/browser /srv