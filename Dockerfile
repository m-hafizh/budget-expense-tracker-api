FROM node:20-bookworm-slim AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM base AS prod-deps
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./package.json

USER node
EXPOSE 3000
CMD ["node", "dist/main/server.js"]
