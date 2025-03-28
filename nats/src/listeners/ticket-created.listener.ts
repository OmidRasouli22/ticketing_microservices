import { Message } from "node-nats-streaming";
import {
  TicketCreatedEvent,
  Listener,
  SUBJECTS,
} from "@omidrasticketsapp/common";

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
  readonly subject = SUBJECTS.TICKET_CREATED;
  queueGroup: string = "payments-service";
  onMessage(data: TicketCreatedEvent["data"], msg: Message): void {
    console.log(`Event Data! - ${data.title}`);
    // Business Logic
    msg.ack();
  }
}
