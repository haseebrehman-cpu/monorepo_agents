FROM node:22-bookworm-slim AS build
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

COPY apps/cts-dashboard apps/cts-dashboard
COPY packages packages

ARG VITE_CTS_API_URL
ENV VITE_CTS_API_URL=$VITE_CTS_API_URL

# This hostname serves the app at /. Local `vite.config.ts` keeps base /cts-dashboard/.
RUN npm exec --workspace=@rdx/cts-dashboard -- tsc -b \
  && npm exec --workspace=@rdx/cts-dashboard -- vite build --base=/

FROM nginx:1.27-alpine
RUN rm -f /etc/nginx/conf.d/default.conf
COPY apps/cts-dashboard/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/cts-dashboard/dist /usr/share/nginx/html
EXPOSE 8080
