# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (for better caching)
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies)
RUN npm ci --include=dev && \
    echo "=== Installed packages ===" && \
    ls -la node_modules/.bin/ | head -20 && \
    echo "=== Vite version ===" && \
    ./node_modules/.bin/vite --version

# Copy source code
COPY . .

# Build the application using explicit path
RUN ./node_modules/.bin/vite build

# Production stage - serve static files
FROM nginx:alpine AS production

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration for SPA routing
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
