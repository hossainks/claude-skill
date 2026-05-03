FROM node:20-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Root package.json is required because frontend/package.json has "eventhub": "file:.."
COPY package.json ./
COPY frontend/package.json frontend/package-lock.json ./frontend/

RUN npm install --prefix frontend

COPY frontend/ ./frontend/
RUN npm run build --prefix frontend

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

COPY package.json ./
COPY --from=builder /app/frontend/package.json ./frontend/
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/node_modules ./frontend/node_modules

EXPOSE 3000
CMD ["npm", "start", "--prefix", "frontend"]
