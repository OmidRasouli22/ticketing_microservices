import {
  ExpirationCompleteEvent,
  Publisher,
  SUBJECTS,
} from "@omidrasticketsapp/common";

export class ExpirationCompletedPublisher extends Publisher<ExpirationCompleteEvent> {
  subject: SUBJECTS.EXPIRATION_COMPLETE = SUBJECTS.EXPIRATION_COMPLETE;
}
