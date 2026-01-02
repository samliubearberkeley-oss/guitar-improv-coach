# Build stage - use full node image (not alpine) to avoid musl compatibility issues
FROM node:20 AS builder

# Ensure devDependencies are installed by default
ENV NODE_ENV=development

# Add node_modules/.bin to PATH so tsc and other binaries are found
ENV PATH="/app/node_modules/.bin:${PATH}"

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies including devDependencies (needed for vite build and tsc)
# Force install devDependencies even if NODE_ENV=production
# Use npm ci if package-lock.json exists, otherwise fall back to npm install
# #region agent log
RUN echo "=== DEBUG: NODE_ENV=$NODE_ENV ===" && \
    (npm ci --include=dev 2>&1 || (echo "=== DEBUG: npm ci failed, trying npm install ===" && NODE_ENV=development npm install --include=dev)) && \
    echo "=== DEBUG: Checking TypeScript installation ===" && \
    ls -la node_modules/.bin/tsc 2>&1 || echo "=== DEBUG: tsc NOT found ===" && \
    test -d node_modules/typescript && echo "=== DEBUG: typescript package exists ===" || echo "=== DEBUG: typescript package NOT found ===" && \
    echo "=== DEBUG: node_modules/.bin contents (first 10) ===" && \
    ls -1 node_modules/.bin/ | head -10 && \
    echo "=== DEBUG: Verifying tsc is executable ===" && \
    (node_modules/.bin/tsc --version && echo "=== DEBUG: tsc works ===" || echo "=== DEBUG: tsc failed ===") && \
    echo "=== DEBUG: Verifying TypeScript is in dependencies ===" && \
    (npm list typescript --depth=0 2>&1 | grep -q typescript && echo "=== DEBUG: TypeScript found in node_modules ===" || echo "=== DEBUG: TypeScript NOT in node_modules ===")
# #endregion

# Verify TypeScript and Vite are installed
RUN echo "=== DEBUG: Verifying TypeScript installation ===" && \
    (npx tsc --version && echo "=== DEBUG: TypeScript verified via npx ===" || (echo "=== DEBUG: TypeScript not found, installing ===" && npm install typescript --save)) && \
    echo "=== DEBUG: Verifying Vite installation ===" && \
    (npx vite --version && echo "=== DEBUG: Vite verified ===" || (echo "=== DEBUG: Vite not found ===" && ls -la node_modules/.bin/ | head -20))

# Copy source code
COPY . .

# Build the application using npx to ensure vite is found
# #region agent log
RUN echo "=== DEBUG: Checking package.json build script ===" && \
    cat package.json | grep '"build"' && \
    echo "=== DEBUG: PATH=$PATH ===" && \
    which tsc && echo "=== DEBUG: tsc found in PATH ===" || echo "=== DEBUG: tsc NOT in PATH, checking npx ===" && \
    (npx tsc --version >/dev/null 2>&1 && echo "=== DEBUG: tsc available via npx ===" || (echo "=== DEBUG: tsc NOT available, installing TypeScript ===" && npm install typescript --save --legacy-peer-deps)) && \
    echo "=== DEBUG: Final TypeScript check ===" && \
    npx tsc --version && \
    echo "=== DEBUG: Running npm run build ===" && \
    npm run build
# #endregion

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
