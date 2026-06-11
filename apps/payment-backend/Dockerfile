FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /payment-backend .

FROM alpine:3.21
RUN apk --no-cache add ca-certificates
COPY --from=builder /payment-backend /payment-backend
EXPOSE 4002
CMD ["/payment-backend"]
