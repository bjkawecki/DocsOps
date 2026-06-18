# Production frontend: static Vite build behind nginx.
# Build context: repo root (docker build -f apps/frontend/Dockerfile .)
FROM node:24-alpine AS builder
RUN corepack enable pnpm
WORKDIR /app
RUN echo "node-linker=hoisted" > .npmrc
ENV HUSKY=0
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/backend ./apps/backend
COPY apps/frontend ./apps/frontend
RUN node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));delete p.devDependencies;if(p.scripts)delete p.scripts.prepare;fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n');"
RUN pnpm install --filter frontend... --no-frozen-lockfile
RUN pnpm --filter frontend run build

FROM nginx:alpine
RUN apk add --no-cache wget
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
