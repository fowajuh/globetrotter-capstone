FROM oven/bun:alpine AS build
WORKDIR /app
COPY backend/ ./
# RUN bun install   <-- REMOVED - using local node_modules
RUN bunx prisma generate && bun run build

FROM node:20-alpine AS runtime
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
RUN npx prisma generate
USER app
EXPOSE 3000
CMD ["node", "dist/main.js"]