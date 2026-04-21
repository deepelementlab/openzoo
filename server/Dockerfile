FROM golang:1.24-alpine AS builder

ARG VERSION=dev
ARG COMMIT=unknown
ARG DATE=unknown

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build \
  -ldflags="-s -w -X main.version=${VERSION} -X main.commit=${COMMIT} -X main.date=${DATE}" \
  -o /openzoo-server ./cmd/server
RUN CGO_ENABLED=0 GOOS=linux go build \
  -ldflags="-s -w -X main.version=${VERSION} -X main.commit=${COMMIT} -X main.date=${DATE}" \
  -o /openzoo ./cmd/openzoo
RUN CGO_ENABLED=0 GOOS=linux go build -o /migrate ./cmd/migrate

FROM alpine:3.21
RUN apk --no-cache add ca-certificates curl
RUN addgroup -g 1000 app && adduser -u 1000 -G app -s /bin/sh -D app

COPY --from=builder /openzoo-server /usr/local/bin/openzoo-server
COPY --from=builder /openzoo /usr/local/bin/openzoo
COPY --from=builder /migrate /usr/local/bin/migrate

USER app
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 8080
ENTRYPOINT ["openzoo-server"]
