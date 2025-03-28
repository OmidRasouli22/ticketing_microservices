import amqp, { Channel } from "amqplib";
import { Publisher } from "./abstract-publisher.rabbitmq"; // Adjust the path as necessary
import { Listener } from "./abstract-listener.rabbitmq"; // Adjust the path as necessary
import { SUBJECTS } from "../../common/src/events/subjects";

async function setup() {
  try {
    // Establish the connection to RabbitMQ
    const connection = await amqp.connect("amqp://localhost"); // Change URL as needed
    const channel: Channel = await connection.createChannel(); // This should work as expected

    // Example publisher setup
    // class OrderCreatedPublisher extends Publisher<{ subject: SUBJECTS.ORDER_UPDATED; data: { orderId: string } }> {
    //   readonlysubject = SUBJECTS.ORDER_UPDATED;
    // }

    // const orderPublisher = new OrderCreatedPublisher(channel);
    // await orderPublisher.publish({ orderId: '12345' });

    // // Example listener setup
    // class OrderCreatedListener extends Listener<{ subject: 'order:created'; data: { orderId: string } }> {
    //   subject = 'order:created';
    //   queueGroup = 'order-service';

    //   onMessage(data, msg) {
    //     console.log(`Received order: ${data.orderId}`);
    //   }
    // }

    // const orderListener = new OrderCreatedListener(channel);
    // await orderListener.listen();
  } catch (err) {
    console.error("Error setting up connection or listeners:", err);
  }
}

setup();
