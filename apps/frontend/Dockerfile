# Production frontend: static Vite build behind nginx.
# Build context: repo root (docker build -f apps/frontend/Dockerfile .)
FROM node:24-alpine AS builder
RUN corepack enable pnpm
WORKDIR /app
RUN echo "node-linker=hoisted" > .npmrc
ENV HUSKY=0
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
# Root prepare (husky) and backend prepare (prisma generate) need sources not yet copied.
RUN node -e "\
const fs=require('fs');\
function strip(path, dropDevDeps){\
  const p=JSON.parse(fs.readFileSync(path,'utf8'));\
  if(dropDevDeps) delete p.devDependencies;\
  if(p.scripts) delete p.scripts.prepare;\
  fs.writeFileSync(path, JSON.stringify(p,null,2)+'\n');\
}\
strip('package.json', true);\
strip('apps/backend/package.json', false);\
"
# Include backend as a filter so its devDependencies (prisma, typescript) are installed.
RUN pnpm install --filter frontend... --filter backend --no-frozen-lockfile
COPY apps/frontend ./apps/frontend
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/prisma ./apps/backend/prisma
COPY apps/backend/prisma.config.ts ./apps/backend/
COPY apps/backend/tsconfig.json apps/backend/tsconfig.build.json ./apps/backend/
RUN pnpm --filter backend exec prisma generate
RUN pnpm --filter frontend run build

FROM nginx:alpine
RUN apk add --no-cache wget
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
