import {
  SUBJECTS,
  Publisher,
  TicketUpdatedEvent,
} from "@omidrasticketsapp/common";

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
  readonly subject = SUBJECTS.TICKET_UPDATED;
}
