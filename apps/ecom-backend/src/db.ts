import postgres from "postgres";

export function createDb(url: string) {
  const sql = postgres(url);
  return {
    sql,
    async migrate() {
      await sql`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, price INTEGER NOT NULL,
          stock INTEGER NOT NULL DEFAULT 0, category TEXT NOT NULL, image_url TEXT
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY, status TEXT NOT NULL DEFAULT 'pending',
          total_amount INTEGER NOT NULL, idempotency_key TEXT NOT NULL UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
    },
    async getProducts() {
      return sql`SELECT id, name, price, stock, category, image_url FROM products WHERE stock > 0`;
    },
    async getProduct(id: string) {
      const [p] = await sql`SELECT id, name, price, stock, category, image_url FROM products WHERE id = ${id}`;
      return p;
    },
    async createOrder(event: {
      cartId: string;
      totalAmount: number;
      idempotencyKey: string;
    }) {
      const id = `order_${Date.now()}`;
      await sql`
        INSERT INTO orders (id, status, total_amount, idempotency_key)
        VALUES (${id}, 'confirmed', ${event.totalAmount}, ${event.idempotencyKey})
        ON CONFLICT (idempotency_key) DO NOTHING
      `;
      return { id, status: "confirmed" as const };
    },
    async seed() {
      const products = [
        {
          id: "p1",
          name: "Premium Widget",
          price: 2999,
          stock: 100,
          category: "widgets",
          image_url: "/images/widget.png",
        },
        {
          id: "p2",
          name: "Pro Gadget",
          price: 4999,
          stock: 50,
          category: "gadgets",
          image_url: "/images/gadget.png",
        },
        {
          id: "p3",
          name: "Starter Kit",
          price: 999,
          stock: 200,
          category: "kits",
          image_url: "/images/kit.png",
        },
      ];
      for (const p of products) {
        await sql`
          INSERT INTO products ${sql(p as any, Object.keys(p) as any)}
          ON CONFLICT (id) DO NOTHING
        `;
      }
    },
  };
}
