import {
  ExpirationCompleteEvent,
  Listener,
  SUBJECTS,
} from "@omidrasticketsapp/common";
import { Message } from "node-nats-streaming";
import { Order, OrderStatus } from "../../models/order.model";
import { OrderCancelledPublisher } from "../publishers";

export class ExpirationCompleteListener extends Listener<ExpirationCompleteEvent> {
  subject: SUBJECTS.EXPIRATION_COMPLETE = SUBJECTS.EXPIRATION_COMPLETE;
  queueGroup: string = "orders-service";

  async onMessage(data: ExpirationCompleteEvent["data"], msg: Message) {
    try {
      const order = await Order.findById(data.orderId).populate("ticket");
      if (!order) throw new Error("Order not Found");

      if (order.status === OrderStatus.COMPLETED) {
        return msg.ack();
      }

      order.set({ status: OrderStatus.CANCELLED });
      await order.save();

      await new OrderCancelledPublisher(this.client).publish({
        id: order.id,
        version: order.version,
        ticket: {
          id: order.ticket.id,
        },
      });

      msg.ack();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
