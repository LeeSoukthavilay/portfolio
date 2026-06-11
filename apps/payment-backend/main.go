package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	_ "github.com/lib/pq"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgresql://portfolio:portfolio_dev@localhost:5433/payment?sslmode=disable"
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("failed to ping database: %v", err)
	}

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS transactions (
			id TEXT PRIMARY KEY,
			amount BIGINT NOT NULL,
			currency TEXT NOT NULL DEFAULT 'USD',
			status TEXT NOT NULL DEFAULT 'pending',
			idempotency_key TEXT NOT NULL UNIQUE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
		CREATE INDEX IF NOT EXISTS idx_transactions_idempotency ON transactions(idempotency_key);
	`); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	store := NewStore(db)
	handler := NewHandler(store)

	mux := http.NewServeMux()
	mux.HandleFunc("/payments", handler.ProcessPayment)
	mux.HandleFunc("/transactions", handler.GetTransaction)

	port := os.Getenv("PORT")
	if port == "" {
		port = "4002"
	}

	log.Printf("Payment backend running on :%s", port)
	if err := http.ListenAndServe(":"+port, corsMiddleware(mux)); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
