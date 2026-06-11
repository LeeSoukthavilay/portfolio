export interface PaymentRequest {
  idempotencyKey: string;
  amount: number;
  currency: string;
  source: string;
  description: string;
}

export interface PaymentResponse {
  transactionId: string;
  status: "processing" | "completed" | "failed";
  idempotencyKey: string;
  timestamp: string;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}
