import { natsWrapper } from "../../../nats-wrapper";
import { Ticket } from "../../../models";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { OrderCancelledEvent } from "@omidrasticketsapp/common";
import { Message } from "node-nats-streaming";
import { OrderCancelledListener } from "../order-cancelled-listener";

/**
 * Setup function to initialize the listener, ticket, event data, and message.
 */
const setup = async () => {
  const listener = new OrderCancelledListener(natsWrapper.client);

  // Create a ticket with an orderId (reserved state)
  const orderId = new mongoose.Types.ObjectId().toHexString();
  const ticket = Ticket.build({
    title: faker.commerce.productName(),
    price: faker.number.int({ min: 10, max: 100 }),
    userId: new mongoose.Types.ObjectId().toHexString(),
  });
  ticket.set({ orderId });
  await ticket.save();

  // Create fake OrderCancelledEvent data
  const fakeData: OrderCancelledEvent["data"] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    version: ticket.version + 1, // Simulate version increment
    ticket: {
      id: ticket.id,
    },
  };

  // Create a fake message object
  // @ts-ignore
  const fakeMsg: Message = {
    ack: jest.fn(), // Mock ack function
  } as Message;

  return { listener, data: fakeData, msg: fakeMsg, ticket, orderId };
};

/**
 * Test 1: Updates the ticket, publishes an event, and acks the message
 */
it("updates the ticket, publishes an event, and acks the message", async () => {
  const { listener, ticket, data, msg } = await setup();

  // Call the onMessage function
  await listener.onMessage(data, msg);

  // Fetch updated ticket
  const updatedTicket = await Ticket.findById(ticket.id);

  // Validate orderId has been removed
  expect(updatedTicket!.orderId).toBeUndefined();

  // Ensure ack is called
  expect(msg.ack).toHaveBeenCalled();

  // Ensure publish is called
  expect(natsWrapper.client.publish).toHaveBeenCalled();
});

/**
 * Test 2: Does not acknowledge message if ticket not found
 */
it("does not ack the message if the ticket is not found", async () => {
  const { listener, data, msg } = await setup();
  data.ticket.id = new mongoose.Types.ObjectId().toHexString();

  await expect(listener.onMessage(data, msg)).rejects.toThrow(
    "Ticket Not Found"
  );

  expect(msg.ack).not.toHaveBeenCalled();
});

/**
 * Test 3: Throws error when ticket is not found
 */
it("throws an error when ticket is not found", async () => {
  const { listener, data, msg } = await setup();
  data.ticket.id = new mongoose.Types.ObjectId().toHexString();

  await expect(listener.onMessage(data, msg)).rejects.toThrow(
    "Ticket Not Found"
  );
});

/**
 * Test 4: Ensures the ticket's version is incremented
 */
it("increments the ticket version after update", async () => {
  const { listener, ticket, data, msg } = await setup();

  await listener.onMessage(data, msg);
  const updatedTicket = await Ticket.findById(ticket.id);

  expect(updatedTicket!.version).toBe(ticket.version + 1);
});

/**
 * Test 5: Publishes ticket updated event
 */
it("publishes a ticket updated event", async () => {
  const { listener, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(natsWrapper.client.publish).toHaveBeenCalled();

  const ticketUpdatedData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  );
  expect(ticketUpdatedData.id).toEqual(data.ticket.id);
});
