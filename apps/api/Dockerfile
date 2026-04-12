FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN npm install

COPY tsconfig.base.json ./
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

RUN npm run build --workspace @school-erp/shared && npm run build --workspace @school-erp/api

EXPOSE 8080

CMD ["npm", "run", "start", "--workspace", "@school-erp/api"]
