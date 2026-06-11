// In-memory store for pending OAuth sessions.
// In production, replace with Redis or a database.

export interface PendingAuth {
  codeVerifier: string;
  state: string;
}

const pendingAuth = new Map<string, PendingAuth>();

export function setPendingAuth(key: string, value: PendingAuth): void {
  pendingAuth.set(key, value);
  // Auto-cleanup after 5 minutes
  setTimeout(() => pendingAuth.delete(key), 5 * 60 * 1000);
}

export function getPendingAuth(key: string): PendingAuth | undefined {
  return pendingAuth.get(key);
}

export function deletePendingAuth(key: string): void {
  pendingAuth.delete(key);
}
