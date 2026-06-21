# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
# Copy built assets from builder
COPY --from=build /app/dist /usr/share/nginx/html
# Add a custom nginx.conf to handle React Router (if needed) and inject env vars if necessary
# For Vite, environment variables are baked in at build time.
# On Railway, environment variables are available during build, so VITE_API_URL will be baked in!
# Railway provides the PORT environment variable. We need Nginx to listen on it.
CMD sed -i -e 's/listen  *80;/listen '"$PORT"';/' /etc/nginx/conf.d/default.conf && nginx -g "daemon off;"
