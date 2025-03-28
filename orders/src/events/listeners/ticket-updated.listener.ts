import { Message } from "node-nats-streaming";
import {
  SUBJECTS,
  Listener,
  TicketUpdatedEvent,
} from "@omidrasticketsapp/common";
import { Ticket } from "../../models/ticket.model";

export class TicketUpdatedListener extends Listener<TicketUpdatedEvent> {
  subject: SUBJECTS.TICKET_UPDATED = SUBJECTS.TICKET_UPDATED;
  queueGroup: string = "orders-service";
  async onMessage(data: TicketUpdatedEvent["data"], msg: Message) {
    const { id, title, price, version } = data;
    const ticket = await Ticket.findByEvent({ id, version });

    if (!ticket) throw new Error("Ticket not found!");

    ticket.set({ title, price });
    await ticket.save();

    msg.ack();
  }
}
