import {
  Listener,
  OrderCancelledEvent,
  SUBJECTS,
} from "@omidrasticketsapp/common";
import { Message } from "node-nats-streaming";
import { Ticket } from "../../models";
import { TicketUpdatedPublisher } from "../publishers/ticket-updated.ppublisher";

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  subject: SUBJECTS.ORDER_CANCELLED = SUBJECTS.ORDER_CANCELLED;

  queueGroup: string = "tickets-service";

  async onMessage(data: OrderCancelledEvent["data"], msg: Message) {
    try {
      // first of all find the ticket that the order associated to
      const ticket = await Ticket.findById(data.ticket.id);

      // if no ticket throw an error
      if (!ticket) throw new Error("Ticket Not Found");

      // mark the ticket as reserved by updating its orderId property
      ticket.set({ orderId: undefined });

      // save the ticket
      await ticket.save();

      //   emit an ticket update event
      await new TicketUpdatedPublisher(this.client).publish(ticket);

      // ack the message
      msg.ack();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
