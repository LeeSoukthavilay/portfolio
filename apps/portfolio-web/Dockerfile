FROM oven/bun:1.2-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY .next/standalone ./
COPY .next/static ./apps/portfolio-web/.next/static
EXPOSE 3000
CMD ["bun", "run", "apps/portfolio-web/server.js"]
