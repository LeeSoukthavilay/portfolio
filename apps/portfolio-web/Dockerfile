FROM oven/bun:1.2-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public
EXPOSE 3000
CMD ["bun", "run", "server.js"]
