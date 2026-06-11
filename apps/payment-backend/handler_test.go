package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	_ "github.com/lib/pq"
)

func setupTestDB(t *testing.T) *sql.DB {
	t.Helper()
	db, err := sql.Open("postgres", "postgresql://portfolio:portfolio_dev@localhost:5433/payment?sslmode=disable")
	if err != nil {
		t.Skip("database not available for integration test")
	}
	if err := db.Ping(); err != nil {
		t.Skip("database not available for integration test")
	}
	db.Exec(`CREATE TABLE IF NOT EXISTS transactions (
		id TEXT PRIMARY KEY,
		amount BIGINT NOT NULL,
		currency TEXT NOT NULL DEFAULT 'USD',
		status TEXT NOT NULL DEFAULT 'pending',
		idempotency_key TEXT NOT NULL UNIQUE,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	)`)
	return db
}

func TestProcessPaymentIdempotency(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	store := NewStore(db)
	handler := NewHandler(store)

	req := PaymentRequest{
		IdempotencyKey: "test-key-001",
		Amount:         1000,
		Currency:       "USD",
		Source:         "card_test",
		Description:    "test payment",
	}
	body, _ := json.Marshal(req)

	// First request — should process
	w1 := httptest.NewRecorder()
	r1 := httptest.NewRequest("POST", "/payments", bytes.NewReader(body))
	handler.ProcessPayment(w1, r1)
	if w1.Code != http.StatusOK {
		t.Fatalf("first request: expected 200, got %d: %s", w1.Code, w1.Body.String())
	}

	var resp1 PaymentResponse
	json.NewDecoder(w1.Body).Decode(&resp1)
	if resp1.Status != "completed" {
		t.Errorf("expected completed, got %s", resp1.Status)
	}

	// Second request with same idempotency key — should return existing
	w2 := httptest.NewRecorder()
	r2 := httptest.NewRequest("POST", "/payments", bytes.NewReader(body))
	handler.ProcessPayment(w2, r2)
	if w2.Code != http.StatusOK {
		t.Fatalf("second request: expected 200, got %d", w2.Code)
	}

	var resp2 PaymentResponse
	json.NewDecoder(w2.Body).Decode(&resp2)
	if resp2.TransactionID != resp1.TransactionID {
		t.Errorf("idempotency failed: expected %s, got %s", resp1.TransactionID, resp2.TransactionID)
	}
}
