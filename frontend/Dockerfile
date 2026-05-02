ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

FROM node:${NODE_VERSION}-alpine AS build
ARG NEXT_PUBLIC_API_BASE
ARG NEXT_PUBLIC_WS_BASE
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}
ENV NEXT_PUBLIC_WS_BASE=${NEXT_PUBLIC_WS_BASE}
RUN pnpm build

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
