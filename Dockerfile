FROM golang:1.27-alpine AS backend-builder

WORKDIR /src/backend
COPY backend/go.mod ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /calculator-api ./cmd/server

FROM node:22-alpine AS frontend-builder

WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.29-alpine

ENV CALCULATOR_API_ADDR=127.0.0.1:8080

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/entrypoint.sh /entrypoint.sh
COPY --from=backend-builder /calculator-api /calculator-api
COPY --from=frontend-builder /src/frontend/dist /usr/share/nginx/html

RUN apk add --no-cache dumb-init \
  && chmod +x /entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--", "/entrypoint.sh"]
