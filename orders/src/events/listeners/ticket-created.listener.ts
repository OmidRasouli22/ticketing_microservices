import { Message } from "node-nats-streaming";
import {
  SUBJECTS,
  Listener,
  TicketCreatedEvent,
} from "@omidrasticketsapp/common";
import { Ticket } from "../../models/ticket.model";

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
  subject: SUBJECTS.TICKET_CREATED = SUBJECTS.TICKET_CREATED;
  queueGroup: string = "orders-service";
  async onMessage(data: TicketCreatedEvent["data"], msg: Message) {
    try {
      const { id, title, price } = data;
      const ticket = Ticket.build({
        title,
        price,
        id,
      });
      await ticket.save();

      msg.ack();
    } catch (error: any) {
      console.log(
        "Error Processing data in TicketCreatedListener: " + error.message
      );
      return;
    }
  }
}
