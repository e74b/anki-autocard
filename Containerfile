FROM node:alpine AS build
COPY . app
WORKDIR /app
RUN npm ci 
RUN npm run build
CMD npm run serve

FROM docker.io/caddy:alpine AS RUN
RUN mkdir /app
COPY config/caddy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/public /app/http
