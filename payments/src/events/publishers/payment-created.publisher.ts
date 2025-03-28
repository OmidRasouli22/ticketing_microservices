import {
  PaymentCreatedEvent,
  Publisher,
  SUBJECTS,
} from "@omidrasticketsapp/common";

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  subject: SUBJECTS.PAYMENT_CREATED = SUBJECTS.PAYMENT_CREATED;
}
