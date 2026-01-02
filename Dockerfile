# Build stage - use full node image (not alpine) to avoid musl compatibility issues
FROM node:20 AS builder

# Ensure devDependencies are installed
ENV NODE_ENV=development

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Delete package-lock.json to force npm to install platform-specific binaries
# This ensures rollup and other native modules get the correct Linux versions
RUN rm -f package-lock.json && \
    echo "=== Installing dependencies for Linux platform ===" && \
    npm install --include=dev && \
    echo "=== Verifying critical packages ===" && \
    npx vite --version && \
    npx tsc --version && \
    echo "=== Checking rollup native modules ===" && \
    ls -la node_modules/@rollup/rollup-linux-x64-gnu 2>&1 || echo "Rollup native module check"

# Copy source code
COPY . .

# Build the application
RUN echo "=== Building application ===" && \
    npm run build && \
    echo "=== Build completed successfully ===" && \
    ls -la dist/

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
