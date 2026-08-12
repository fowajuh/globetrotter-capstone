FROM oven/bun:alpine AS build
WORKDIR /app
COPY frontend/ ./
# RUN bun install   <-- REMOVED - using local node_modules
RUN bun run build

FROM nginx:1.27-alpine AS runtime
RUN adduser -D -H -u 1001 app
COPY --from=build /app/dist /usr/share/nginx/html
COPY frontend/docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 5173
HEALTHCHECK --interval=15s --timeout=3s CMD wget -qO- http://localhost:5173 || exit 1
CMD ["nginx", "-g", "daemon off;"]