import { OrderCreatedListener } from "../order-created-listener";
import { natsWrapper } from "../../../nats-wrapper";
import { Ticket } from "../../../models";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { OrderCreatedEvent, OrderStatus } from "@omidrasticketsapp/common";
import { Message } from "node-nats-streaming";

/**
 * Helper function to create a ticket in the database.
 */
const createTicket = async () => {
  const ticket = Ticket.build({
    title: faker.commerce.productName(), // Random product name
    price: faker.number.int({ min: 10, max: 100 }), // Random price between 10 and 100
    userId: new mongoose.Types.ObjectId().toHexString(),
  });

  await ticket.save();
  return ticket;
};

/**
 * Setup function to initialize the listener, ticket, event data, and message.
 */
const setup = async () => {
  // Create an instance of the OrderCreatedListener
  const listener = new OrderCreatedListener(natsWrapper.client);

  // Create a ticket and save it to the database
  const ticket = await createTicket();

  // Create fake OrderCreatedEvent data
  const fakeData: OrderCreatedEvent["data"] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    userId: new mongoose.Types.ObjectId().toHexString(),
    expiresAt: new Date().toISOString(),
    status: OrderStatus.CREATED,
    version: 0,
    ticket: {
      id: ticket.id,
      price: ticket.price,
    },
  };

  // Create a fake message object
  // @ts-ignore
  const fakeMsg: Message = {
    ack: jest.fn(), // Mock ack function
  } as Message;

  return { listener, data: fakeData, msg: fakeMsg, ticket };
};

/**
 * Test 1: Ensure orderId is set correctly on the ticket.
 */
it("sets the orderId of the ticket", async () => {
  const { listener, ticket, data, msg } = await setup();

  // Call the onMessage function with data and message
  await listener.onMessage(data, msg);

  // Fetch the updated ticket
  const updatedTicket = await Ticket.findById(ticket.id);

  // Assertions
  expect(updatedTicket!.orderId).toEqual(data.id);
  expect(updatedTicket!.price).toEqual(data.ticket.price);
});

/**
 * Test 2: Ensure msg.ack() is called after processing the event.
 */
it("acks the message successfully", async () => {
  const { listener, data, msg } = await setup();

  // Call the onMessage function
  await listener.onMessage(data, msg);

  // Assert ack was called
  expect(msg.ack).toHaveBeenCalled();
});

/**
 * Test 3: Ensure an error is thrown if the ticket does not exist.
 */
it("throws an error if the ticket is not found", async () => {
  const { listener, data, msg } = await setup();

  // Set an invalid ticket ID
  data.ticket.id = new mongoose.Types.ObjectId().toHexString();

  // Call the onMessage function and expect an error
  await expect(listener.onMessage(data, msg)).rejects.toThrow(
    "Ticket Not Found"
  );
});

/**
 * Test 4: Ensure msg.ack() is not called if an error occurs.
 */
it("does not ack the message if an error occurs", async () => {
  const { listener, data, msg } = await setup();

  // Set an invalid ticket ID to trigger an error
  data.ticket.id = new mongoose.Types.ObjectId().toHexString();

  // Call the onMessage function and handle the error
  await expect(listener.onMessage(data, msg)).rejects.toThrow();

  // Assert ack was NOT called
  expect(msg.ack).not.toHaveBeenCalled();
});

/**
 * Test 5: Ensure that it publishes a ticket updated event
 */
it("publishes  a ticket updated event after update and ticket", async () => {
  const { listener, data, msg } = await setup();

  // Call the onMessage function
  await listener.onMessage(data, msg);

  expect(natsWrapper.client.publish).toHaveBeenCalled();

  const ticketUpdatedData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  );
  expect(ticketUpdatedData.orderId).toEqual(data.id);

  // Assert ack was called
  expect(msg.ack).toHaveBeenCalled();
});
