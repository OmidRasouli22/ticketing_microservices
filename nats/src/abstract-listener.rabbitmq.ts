import amqp, { Channel, Connection, Message } from "amqplib";
import { SUBJECTS } from "../../common/src/events/subjects";

/**
 * Interface for the event structure to be published.
 */
interface Event {
  subject: SUBJECTS;
  data: any;
}

/**
 * Abstract Listener class for RabbitMQ.
 * Provides a base structure to listen to events with custom logic.
 */
export abstract class Listener<T extends Event> {
  /**
   * Subject (queue) to listen to.
   */
  abstract subject: T["subject"];

  /**
   * Queue group name for handling durable subscriptions.
   */
  abstract queueGroup: string;

  /**
   * Custom logic to handle incoming messages.
   */
  abstract onMessage(data: T["data"], msg: Message): void;

  /**
   * RabbitMQ channel instance.
   */
  private channel: Channel;

  /**
   * Creates an instance of Listener.
   *
   * @param channel The RabbitMQ channel used to connect to the RabbitMQ server.
   */
  constructor(channel: Channel) {
    if (!channel) {
      throw new Error("RabbitMQ channel is required for the listener.");
    }
    this.channel = channel;
  }

  /**
   * Starts listening to the specified subject with configured options.
   * Attaches the message handler to process incoming messages.
   */
  async listen(): Promise<void> {
    try {
      // Declare a queue for the subject (event)
      await this.channel.assertQueue(this.subject, {
        durable: true, // Ensures that the queue survives server restarts
      });

      // Start consuming messages from the queue
      this.channel.consume(this.subject, (msg) => {
        if (msg !== null) {
          const parsedData = this.parseMessage(msg);
          this.onMessage(parsedData, msg);
          this.channel.ack(msg); // Acknowledge the message after it's processed
        }
      });

      console.log(`Listening on queue: ${this.subject}`);
    } catch (err: any) {
      console.error(`Error occurred while starting listener: ${err.message}`);
      throw err;
    }
  }

  /**
   * Parses the message data, handling potential JSON parsing errors.
   */
  private parseMessage(msg: Message): any {
    const data = msg.content.toString();
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error("Failed to parse message", error);
      return null;
    }
  }
}
