import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { createDb } from "./db";
import { createRabbitMQConnection, publishCheckout } from "./rabbitmq";

const DB_URL = process.env.DATABASE_URL || "postgres://portfolio:portfolio_dev@localhost:5434/ecom";
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://portfolio:portfolio_dev@localhost:5672";

async function main() {
  const db = createDb(DB_URL);
  await db.migrate();
  await db.seed();

  let channel: import("amqplib").Channel | null = null;
  try {
    const mq = await createRabbitMQConnection(RABBITMQ_URL);
    channel = mq.channel;
    console.log("Connected to RabbitMQ");
  } catch (err) {
    console.warn("RabbitMQ not available, running without messaging:", (err as Error).message);
  }

  const app = new Elysia()
    .use(cors())
    .get("/products", async () => {
      const products = await db.getProducts();
      return { products };
    })
    .get("/products/:id", async ({ params }) => {
      const product = await db.getProduct(params.id);
      if (!product) return new Response("Not found", { status: 404 });
      return { product };
    })
    .post(
      "/checkout",
      async ({ body }) => {
        const { productId, idempotencyKey } = body;

        const product = await db.getProduct(productId);
        if (!product) return new Response("Product not found", { status: 404 });

        const totalAmount = Number(product.price);

        const order = await db.createOrder({
          cartId: `cart_${productId}`,
          totalAmount,
          idempotencyKey,
        });

        if (channel) {
          await publishCheckout(channel, {
            type: "checkout.requested",
            cartId: `cart_${productId}`,
            totalAmount,
            idempotencyKey,
            timestamp: new Date().toISOString(),
          });
        }

        return {
          orderId: order.id,
          status: order.status,
          totalAmount,
          timestamp: new Date().toISOString(),
        } satisfies import("@portfolio/shared-types").CheckoutResponse;
      },
      {
        body: t.Object({
          productId: t.String(),
          idempotencyKey: t.String(),
        }),
      }
    )
    .listen(4003);

  console.log(`E-Commerce backend running on http://localhost:${app.server?.port}`);
}

main().catch((err) => {
  console.error("Failed to start e-commerce backend:", err);
  process.exit(1);
});
