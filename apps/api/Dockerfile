FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN npm ci --workspace @school-erp/shared --workspace @school-erp/api
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/
RUN npm run build --workspace @school-erp/shared
RUN npm run build --workspace @school-erp/api

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/packages/shared/package.json packages/shared/
COPY --from=builder /app/packages/shared/dist/ packages/shared/dist/
COPY --from=builder /app/apps/api/package.json apps/api/
COPY --from=builder /app/apps/api/dist/ apps/api/dist/
RUN npm ci --workspace @school-erp/shared --workspace @school-erp/api --omit=dev
EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
