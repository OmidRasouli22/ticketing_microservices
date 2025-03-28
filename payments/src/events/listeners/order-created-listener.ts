import {
  Listener,
  OrderCreatedEvent,
  OrderStatus,
  SUBJECTS,
} from "@omidrasticketsapp/common";
import { Message } from "node-nats-streaming";
import { Order } from "../../models/order.model";

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  subject = SUBJECTS.ORDER_CREATED as SUBJECTS.ORDER_CREATED;
  queueGroup: string = "payments-service";
  async onMessage(data: OrderCreatedEvent["data"], msg: Message) {
    try {
      const order = Order.build({
        id: data.id,
        price: data.ticket.price,
        userId: data.userId,
        status: data.status,
        version: data.version,
      });
      await order.save();

      msg.ack();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
