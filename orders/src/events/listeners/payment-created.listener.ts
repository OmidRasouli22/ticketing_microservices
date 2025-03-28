import {
  Listener,
  OrderStatus,
  PaymentCreatedEvent,
  SUBJECTS,
} from "@omidrasticketsapp/common";
import { Message } from "node-nats-streaming";
import { Order } from "../../models/order.model";

export class PaymentCreatedListener extends Listener<PaymentCreatedEvent> {
  subject: SUBJECTS.PAYMENT_CREATED = SUBJECTS.PAYMENT_CREATED;
  queueGroup: string = "orders-service";

  async onMessage(data: PaymentCreatedEvent["data"], msg: Message) {
    try {
      const order = await Order.findById(data.orderId);
      if (!order) throw new Error("Order not foudn");

      order.set({ status: OrderStatus.COMPLETED });
      await order.save();

      //   technically should emit an order:update event just in case of version and concurrency problem

      msg.ack();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
