FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Expose Vite's default port
EXPOSE 5173

# Run the dev server, host 0.0.0.0 ensures it's accessible from outside container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
