import amqp from "amqplib";

const EXCHANGE = "ecom.events";
const CHECKOUT_QUEUE = "checkout.orders";
const PAYMENT_RESULT_QUEUE = "payment.results";

export interface CheckoutEvent {
  type: "checkout.requested";
  cartId: string;
  totalAmount: number;
  idempotencyKey: string;
  timestamp: string;
}

export interface PaymentResultEvent {
  type: "payment.completed" | "payment.failed";
  orderId: string;
  transactionId?: string;
  idempotencyKey: string;
  timestamp: string;
}

export async function createRabbitMQConnection(url: string) {
  const conn = await amqp.connect(url);
  const channel = await conn.createChannel();
  await channel.assertExchange(EXCHANGE, "topic", { durable: true });
  await channel.assertQueue(CHECKOUT_QUEUE, { durable: true });
  await channel.assertQueue(PAYMENT_RESULT_QUEUE, { durable: true });
  await channel.bindQueue(CHECKOUT_QUEUE, EXCHANGE, "checkout.*");
  await channel.bindQueue(PAYMENT_RESULT_QUEUE, EXCHANGE, "payment.*");
  return { conn, channel };
}

export async function publishCheckout(
  channel: amqp.Channel,
  event: CheckoutEvent
): Promise<void> {
  channel.publish(
    EXCHANGE,
    "checkout.requested",
    Buffer.from(JSON.stringify(event)),
    {
      persistent: true,
      messageId: event.idempotencyKey,
    }
  );
}

export async function consumePaymentResults(
  channel: amqp.Channel,
  handler: (event: PaymentResultEvent) => Promise<void>
): Promise<void> {
  await channel.consume(PAYMENT_RESULT_QUEUE, async (msg) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString()) as PaymentResultEvent;
      await handler(event);
      channel.ack(msg);
    } catch (err) {
      channel.nack(msg, false, false);
    }
  });
}
