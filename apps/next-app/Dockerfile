FROM oven/bun:1

WORKDIR /app

COPY package*.json ./
RUN bun install

COPY . .
COPY db.db ./db.db
RUN bun run scripts/migrate-sqlite-to-postgres.ts

EXPOSE 3000

CMD ["bun", "run", "dev"]
