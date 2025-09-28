# Stage 1: Build React app
FROM node:20-alpine AS build

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --silent

# Copy source code and build
COPY . .
# Build with env vars (they will be baked in)
ARG REACT_APP_DEVICE_HTTP
ARG REACT_APP_DEVICE_WS
ENV REACT_APP_DEVICE_HTTP=$REACT_APP_DEVICE_HTTP
ENV REACT_APP_DEVICE_WS=$REACT_APP_DEVICE_WS

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built app from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]