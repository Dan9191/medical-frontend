# --- stage 1: build react app ---
FROM node:20-alpine AS build
WORKDIR /app

# установка зависимостей
COPY package*.json ./
RUN npm ci

# копируем исходники
COPY . .

# передаём адрес API (будет доступен как process.env.REACT_APP_API_BASE_URL)
ARG REACT_APP_DEVICE_HTTP
ARG REACT_APP_DEVICE_WS
ENV REACT_APP_DEVICE_HTTP=$REACT_APP_DEVICE_HTTP
ENV REACT_APP_DEVICE_WS=$REACT_APP_DEVICE_WS

# сборка
RUN npm run build

# --- stage 2: serve with nginx ---
FROM nginx:alpine

# удаляем дефолтный конфиг
RUN rm /etc/nginx/conf.d/default.conf

# свой конфиг для SPA (всегда отдаём index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# копируем собранный билд
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]