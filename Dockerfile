# Build stage - use full node image (not alpine) to avoid musl compatibility issues
FROM node:20 AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies including devDependencies (needed for vite build)
RUN npm ci --include=dev

# Verify vite is installed
RUN npx vite --version || (echo "Vite not found, listing node_modules:" && ls -la node_modules/.bin/ | head -20)

# Copy source code
COPY . .

# Build the application using npx to ensure vite is found
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
