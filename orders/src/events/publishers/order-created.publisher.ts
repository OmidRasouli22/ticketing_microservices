import {
  Publisher,
  OrderCreatedEvent,
  SUBJECTS,
} from "@omidrasticketsapp/common";

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
  subject: SUBJECTS.ORDER_CREATED = SUBJECTS.ORDER_CREATED;
}
