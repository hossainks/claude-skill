FROM node:20-alpine
WORKDIR /app

# Root package.json is required because backend/package.json has "eventhub": "file:.."
COPY package.json ./
COPY backend/package.json backend/package-lock.json ./backend/

RUN npm install --prefix backend --omit=dev

COPY backend/ ./backend/
COPY docker-entrypoint-backend.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3001
ENTRYPOINT ["/entrypoint.sh"]
