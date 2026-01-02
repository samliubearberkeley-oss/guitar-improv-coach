# Build stage - use full node image (not alpine) to avoid musl compatibility issues
FROM node:20 AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies - use npm install to get correct platform binaries
# Delete package-lock.json first to avoid platform mismatch
RUN rm -f package-lock.json && npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage - serve static files with nginx
FROM nginx:alpine AS production

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx configuration for SPA routing
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
