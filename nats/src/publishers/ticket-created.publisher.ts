import {
  Publisher,
  TicketCreatedEvent,
  SUBJECTS,
} from "@omidrasticketsapp/common";

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  readonly subject = SUBJECTS.TICKET_CREATED;
}
