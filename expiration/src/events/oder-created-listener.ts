import {
  Listener,
  OrderCreatedEvent,
  SUBJECTS,
} from "@omidrasticketsapp/common";
import { Message } from "node-nats-streaming";
import { expirationQueue } from "../queues/expiration.queue";

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  subject: SUBJECTS.ORDER_CREATED = SUBJECTS.ORDER_CREATED;
  queueGroup: string = "expiration-service";

  async onMessage(data: OrderCreatedEvent["data"], msg: Message) {
    try {
      const delay = new Date(data.expiresAt).getTime() - new Date().getTime();
      // Add job with configuration options
      await expirationQueue.add(
        { orderId: data.id },
        {
          attempts: 5, // Retry up to 5 times if processing fails
          removeOnComplete: true, // Automatically remove successful jobs
          removeOnFail: false, // Keep failed jobs for investigation
          priority: 1, // Lower value means higher priority
          delay,
        }
      );

      // Acknowledge the message
      msg.ack();
    } catch (error) {
      console.error(
        `Failed to process OrderCreated event for orderId: ${data.id}`,
        error
      );
      // Optionally, don't ack if there's an error to retry later
    }
  }
}
