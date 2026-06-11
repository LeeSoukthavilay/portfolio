FROM oven/bun:1.2-alpine
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY . .
EXPOSE 4004
EXPOSE 4005
CMD ["bun", "src/index.ts"]
