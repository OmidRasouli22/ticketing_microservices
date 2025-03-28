import amqp, { Channel, Connection } from "amqplib";
import { SUBJECTS } from "../../common/src/events/subjects";

/**
 * Interface for the event structure to be published.
 */
interface Event {
  subject: SUBJECTS;
  data: any;
}

/**
 * Abstract base class to be extended by specific publishers. Handles the publishing of events to RabbitMQ.
 *
 * @template T The type of event being published, extending from Event.
 */
export abstract class Publisher<T extends Event> {
  /**
   * The subject of the event to be published. This is defined by the subclass.
   */
  abstract subject: T["subject"];

  /**
   * The RabbitMQ channel used to publish events.
   */
  private channel: Channel;

  /**
   * Creates an instance of Publisher.
   *
   * @param channel The RabbitMQ channel used to connect to the RabbitMQ server.
   */
  constructor(channel: Channel) {
    if (!channel) {
      throw new Error("RabbitMQ channel is required for the publisher.");
    }
    this.channel = channel;
  }

  /**
   * Publishes the event data to the specified subject in RabbitMQ.
   *
   * @param data The data associated with the event to be published.
   * @returns A Promise that resolves when the event is published.
   */
  async publish(data: T["data"]): Promise<void> {
    try {
      // Declare a queue for the subject (event)
      await this.channel.assertQueue(this.subject, {
        durable: true, // Messages will be persisted even if RabbitMQ crashes
      });

      // Publish the event to the queue
      this.channel.sendToQueue(
        this.subject,
        Buffer.from(JSON.stringify(data)),
        {
          persistent: true, // Ensures the message is persistent and will not be lost
        }
      );

      console.log(
        `Data successfully published to subject ${this.subject}:`,
        data
      );
    } catch (err: any) {
      console.error(`Error occurred while publishing data: ${err.message}`);
      throw err;
    }
  }
}
