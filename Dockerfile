# --- Сборка фронтенда ---
FROM node:20-alpine AS build

WORKDIR /app

# Прокидываем переменные для React
ARG REACT_APP_DEVICE_HTTP
ARG REACT_APP_DEVICE_WS

ENV REACT_APP_DEVICE_HTTP=$REACT_APP_DEVICE_HTTP
ENV REACT_APP_DEVICE_WS=$REACT_APP_DEVICE_WS

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


# --- Сервер на nginx ---
FROM nginx:alpine

# Аргументы для nginx-конфига
ARG BACKEND_HTTP_URL
ARG BACKEND_WS_URL
ARG BACKEND_HOST

# Понадобится gettext для envsubst
RUN apk add --no-cache gettext

# Копируем шаблон nginx-конфига
COPY nginx.conf.template /etc/nginx/conf.d/nginx.conf.template

# Подставляем значения ARG → nginx.conf
RUN envsubst '${BACKEND_HTTP_URL} ${BACKEND_WS_URL} ${BACKEND_HOST}' \
      < /etc/nginx/conf.d/nginx.conf.template \
      > /etc/nginx/conf.d/default.conf \
    && rm /etc/nginx/conf.d/nginx.conf.template

# Копируем собранный фронт
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
