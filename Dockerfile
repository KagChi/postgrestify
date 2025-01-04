FROM ghcr.io/hazmi35/node:20-dev as build-stage

WORKDIR /tmp/build

RUN corepack enable && corepack prepare pnpm@latest

RUN apt update && apt install -y build-essential git python3

COPY package*.json .
COPY pnpm-lock.yaml .

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

RUN pnpm prune --production

FROM ghcr.io/hazmi35/node:20

WORKDIR /app

RUN apt update && apt install -y tzdata

COPY --from=build-stage /tmp/build/package.json .
COPY --from=build-stage /tmp/build/pnpm-lock.yaml .
COPY --from=build-stage /tmp/build/node_modules ./node_modules
COPY --from=build-stage /tmp/build/dist ./dist
COPY --from=build-stage /tmp/build/drizzle ./drizzle

CMD node dist/index.js
