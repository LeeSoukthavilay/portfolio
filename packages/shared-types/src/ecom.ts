export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totalAmount: number;
}

export interface CheckoutRequest {
  cartId: string;
  idempotencyKey: string;
}

export interface CheckoutResponse {
  orderId: string;
  status: "confirmed" | "payment_pending" | "failed";
  totalAmount: number;
  timestamp: string;
}
