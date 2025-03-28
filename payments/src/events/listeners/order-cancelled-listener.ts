import {
  Listener,
  OrderCancelledEvent,
  OrderStatus,
  SUBJECTS,
} from "@omidrasticketsapp/common";
import { Message } from "node-nats-streaming";
import { Order } from "../../models/order.model";

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  subject = SUBJECTS.ORDER_CANCELLED as SUBJECTS.ORDER_CANCELLED;
  queueGroup: string = "payments-service";
  async onMessage(data: OrderCancelledEvent["data"], msg: Message) {
    try {
      const order = await Order.findOne({
        _id: data.id,
        version: data.version - 1,
      });
      if (!order) throw new Error("Order not found");

      order.set({ status: OrderStatus.CANCELLED });
      await order.save();

      msg.ack();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
