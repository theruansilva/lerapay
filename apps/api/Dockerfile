FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/tsconfig.json apps/api/nest-cli.json apps/api/

RUN npm install --workspace=apps/api

FROM base AS development
COPY apps/api/src apps/api/src
EXPOSE 3000
CMD ["npm", "run", "start:dev", "--workspace=apps/api"]

FROM base AS builder
COPY apps/api/src apps/api/src
RUN npm run build --workspace=apps/api

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "apps/api/dist/main"]
