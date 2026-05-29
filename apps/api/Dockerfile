FROM node:22-alpine AS deps
WORKDIR /repo
COPY package.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm install

FROM deps AS build
COPY apps/api apps/api
RUN npm run build -w @xo-rps/api

FROM node:22-alpine AS runner
ENV NODE_ENV=production
ENV PORT=3001
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY apps/api/package.json ./apps/api/package.json
WORKDIR /repo/apps/api
EXPOSE 3001
CMD ["node", "dist/main.js"]
