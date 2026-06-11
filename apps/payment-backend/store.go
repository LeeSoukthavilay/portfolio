package main

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"time"
)

type Transaction struct {
	ID             string    `json:"id"`
	Amount         int64     `json:"amount"`
	Currency       string    `json:"currency"`
	Status         string    `json:"status"`
	IdempotencyKey string    `json:"idempotencyKey"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

type PaymentRequest struct {
	IdempotencyKey string `json:"idempotencyKey"`
	Amount          int64  `json:"amount"`
	Currency        string `json:"currency"`
	Source          string `json:"source"`
	Description     string `json:"description"`
}

type PaymentResponse struct {
	TransactionID  string `json:"transactionId"`
	Status         string `json:"status"`
	IdempotencyKey string `json:"idempotencyKey"`
	Timestamp      string `json:"timestamp"`
}

type Store struct {
	db *sql.DB
}

func NewStore(db *sql.DB) *Store {
	return &Store{db: db}
}

func (s *Store) AcquireLock(ctx context.Context, key string) error {
	var locked bool
	err := s.db.QueryRowContext(ctx, "SELECT pg_try_advisory_lock(hashtext($1))", key).Scan(&locked)
	if err != nil {
		return err
	}
	if !locked {
		return errors.New("could not acquire lock")
	}
	return nil
}

func (s *Store) ReleaseLock(key string) error {
	_, err := s.db.Exec("SELECT pg_advisory_unlock(hashtext($1))", key)
	return err
}

func (s *Store) ProcessPayment(ctx context.Context, req PaymentRequest) (*PaymentResponse, error) {
	// Check for existing transaction with this idempotency key (pre-lock check)
	existing, err := s.GetByIdempotencyKey(ctx, req.IdempotencyKey)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}
	if existing != nil {
		return &PaymentResponse{
			TransactionID:  existing.ID,
			Status:         existing.Status,
			IdempotencyKey: existing.IdempotencyKey,
			Timestamp:      existing.UpdatedAt.Format(time.RFC3339),
		}, nil
	}

	// Acquire distributed lock
	if err := s.AcquireLock(ctx, req.IdempotencyKey); err != nil {
		return nil, err
	}
	defer s.ReleaseLock(req.IdempotencyKey)

	// Double-check after acquiring lock (prevents race condition)
	existing, err = s.GetByIdempotencyKey(ctx, req.IdempotencyKey)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}
	if existing != nil {
		return &PaymentResponse{
			TransactionID:  existing.ID,
			Status:         existing.Status,
			IdempotencyKey: existing.IdempotencyKey,
			Timestamp:      existing.UpdatedAt.Format(time.RFC3339),
		}, nil
	}

	// Create transaction
	id, err := generateID()
	if err != nil {
		return nil, fmt.Errorf("failed to generate ID: %w", err)
	}
	now := time.Now()

	_, err = s.db.ExecContext(ctx,
		"INSERT INTO transactions (id, amount, currency, status, idempotency_key, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
		id, req.Amount, req.Currency, "completed", req.IdempotencyKey, now, now,
	)
	if err != nil {
		return nil, err
	}

	return &PaymentResponse{
		TransactionID:  id,
		Status:         "completed",
		IdempotencyKey: req.IdempotencyKey,
		Timestamp:      now.Format(time.RFC3339),
	}, nil
}

func (s *Store) GetByIdempotencyKey(ctx context.Context, key string) (*Transaction, error) {
	tx := &Transaction{}
	err := s.db.QueryRowContext(ctx,
		"SELECT id, amount, currency, status, idempotency_key, created_at, updated_at FROM transactions WHERE idempotency_key = $1", key,
	).Scan(&tx.ID, &tx.Amount, &tx.Currency, &tx.Status, &tx.IdempotencyKey, &tx.CreatedAt, &tx.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return tx, nil
}

func generateID() (string, error) {
	b := make([]byte, 8)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return "txn_" + hex.EncodeToString(b), nil
}
