# Stage 1: Build React app
FROM node:20-alpine AS build

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --silent

# Copy source code
COPY . .

# Build with env vars (they will be baked in)
ARG REACT_APP_DEVICE_HTTP=/v1/device
ARG REACT_APP_DEVICE_WS=/ws
ENV REACT_APP_DEVICE_HTTP=$REACT_APP_DEVICE_HTTP
ENV REACT_APP_DEVICE_WS=$REACT_APP_DEVICE_WS

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built app from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx.conf template
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Substitute environment variables in nginx.conf
CMD envsubst '${BACKEND_HTTP_URL} ${BACKEND_WS_URL} ${BACKEND_HOST}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'