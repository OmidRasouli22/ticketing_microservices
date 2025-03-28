import {
  Publisher,
  OrderCancelledEvent,
  SUBJECTS,
} from "@omidrasticketsapp/common";

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  subject: SUBJECTS.ORDER_CANCELLED = SUBJECTS.ORDER_CANCELLED;
}
