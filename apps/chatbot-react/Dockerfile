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

COPY apps/chatbot-react apps/chatbot-react
COPY packages packages

ARG VITE_STORE_NAME
ARG VITE_STOREFRONT_HOST
ARG VITE_CHAT_API_URL
ARG VITE_TENANT
ARG VITE_SESSION_TOKEN
ENV VITE_STORE_NAME=$VITE_STORE_NAME \
    VITE_STOREFRONT_HOST=$VITE_STOREFRONT_HOST \
    VITE_CHAT_API_URL=$VITE_CHAT_API_URL \
    VITE_TENANT=$VITE_TENANT \
    VITE_SESSION_TOKEN=$VITE_SESSION_TOKEN

RUN npm run build --workspace=@rdx/chatbot

FROM nginx:1.27-alpine
COPY apps/chatbot-react/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/apps/chatbot-react/dist /usr/share/nginx/html
ENV NGINX_ENVSUBST_FILTER=PORT
EXPOSE 8080
