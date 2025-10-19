FROM node:18-alpine AS build

WORKDIR /app

ARG VITE_BACKEND_URL
ARG VITE_PORT
ARG VITE_GENERATE_SOURCEMAP

ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
ENV VITE_PORT=${VITE_PORT}
ENV VITE_GENERATE_SOURCEMAP=${VITE_GENERATE_SOURCEMAP}

COPY ./package.json ./package-lock.json* ./
RUN npm install

COPY . .

RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

RUN apk add --no-cache bash curl gettext \
  && npm install -g serve

COPY --from=build /app/dist ./dist

COPY ./config/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
