# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS builder

WORKDIR /app

# Install dependencies first (better caching)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy project files and build
COPY . .
RUN bun run build

# Start a new stage for a smaller production image
FROM oven/bun:1-slim

WORKDIR /app

# Copy built application from the builder stage
COPY --from=builder /app/.output ./.output

EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["bun", "run", ".output/server/index.mjs"]
