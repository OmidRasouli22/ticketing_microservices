import nats from "node-nats-streaming";
import { randomBytes } from "crypto";
import { TicketCreatedPublisher } from "./publishers/ticket-created.publisher";

const stan = nats.connect("ticketing", randomBytes(4).toString("hex"), {
  url: "http://localhost:4222",
});

stan.on("connect", async () => {
  console.log("Publisher connected to NATS");

  const publisher = new TicketCreatedPublisher(stan);
  try {
    await publisher.publish({
      id: "123",
      price: 11,
      title: "test-publisher title",
      userId: "12333",
    });
  } catch (error) {
    console.log(error);
  }

  stan.on("close", () => {
    console.log("NATS connection closed!");
    process.exit();
  });
});

process.on("SIGINT", () => stan.close());
process.on("SIGTERM", () => stan.close());
