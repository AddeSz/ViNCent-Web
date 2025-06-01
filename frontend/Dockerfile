FROM node:18-alpine AS build

WORKDIR /app
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

ARG VITE_PORT
ENV VITE_PORT=$VITE_PORT

COPY ./package.json ./package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist

CMD ["sh", "-c", "serve -s dist -l $VITE_PORT"]