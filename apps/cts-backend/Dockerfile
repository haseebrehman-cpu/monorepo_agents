FROM node:22-bookworm-slim
WORKDIR /app

RUN corepack enable && corepack prepare npm@11.14.1 --activate

COPY package.json package-lock.json ./
COPY apps/cts-backend/package.json apps/cts-backend/
COPY apps/cts-dashboard/package.json apps/cts-dashboard/
COPY apps/dashboard/package.json apps/dashboard/
COPY apps/chatbot-react/package.json apps/chatbot-react/
COPY apps/storybook/package.json apps/storybook/
COPY packages/api-client/package.json packages/api-client/
COPY packages/chat-contract/package.json packages/chat-contract/
COPY packages/ui/package.json packages/ui/
COPY packages/tsconfig/package.json packages/tsconfig/

RUN npm ci

COPY apps/cts-backend apps/cts-backend
RUN npm run build --workspace=@rdx/cts-backend \
  && cp -r apps/cts-backend/src/db/migrations apps/cts-backend/dist/db/migrations

ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app/apps/cts-backend
USER node
EXPOSE 8080
CMD ["node", "docker-entrypoint.mjs"]
