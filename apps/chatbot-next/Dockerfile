# Build context is the monorepo root.
FROM node:22-bookworm-slim AS build
WORKDIR /app

RUN corepack enable && corepack prepare npm@11.14.1 --activate

COPY package.json package-lock.json ./
COPY apps/chatbot-next/package.json apps/chatbot-next/
COPY apps/chatbot-react/package.json apps/chatbot-react/
COPY apps/cts-backend/package.json apps/cts-backend/
COPY apps/cts-dashboard/package.json apps/cts-dashboard/
COPY apps/dashboard/package.json apps/dashboard/
COPY apps/storybook/package.json apps/storybook/
COPY packages/api-client/package.json packages/api-client/
COPY packages/chat-contract/package.json packages/chat-contract/
COPY packages/ui/package.json packages/ui/
COPY packages/tsconfig/package.json packages/tsconfig/

RUN npm ci

COPY apps/chatbot-next apps/chatbot-next
COPY packages packages

# NEXT_PUBLIC_* values are baked in at build time.
ARG NEXT_PUBLIC_CHAT_API_BASE
ARG NEXT_PUBLIC_STORE_NAME
ENV NEXT_PUBLIC_CHAT_API_BASE=$NEXT_PUBLIC_CHAT_API_BASE \
    NEXT_PUBLIC_STORE_NAME=$NEXT_PUBLIC_STORE_NAME \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build --workspace=@rdx/chatbot-next

FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3010

COPY --from=build --chown=node:node /app/apps/chatbot-next/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/chatbot-next/.next/static ./apps/chatbot-next/.next/static
COPY --from=build --chown=node:node /app/apps/chatbot-next/public ./apps/chatbot-next/public

USER node
EXPOSE 3010
# The slim image has no curl/wget, so probe with Node's fetch.
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3010)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "apps/chatbot-next/server.js"]
