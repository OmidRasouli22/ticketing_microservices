import { OrderCreatedListener } from "../order-created-listener";
import { natsWrapper } from "../../../nats-wrapper";
import mongoose from "mongoose";
import { OrderCreatedEvent, OrderStatus } from "@omidrasticketsapp/common";
import { Message } from "node-nats-streaming";
import { Order } from "../../../models/order.model";

/**
 * Setup function to initialize the listener, ticket, event data, and message.
 */
const setup = async () => {
  // Create an instance of the OrderCreatedListener
  const listener = new OrderCreatedListener(natsWrapper.client);

  // Create fake OrderCreatedEvent data
  const fakeData: OrderCreatedEvent["data"] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    userId: new mongoose.Types.ObjectId().toHexString(),
    expiresAt: new Date().toISOString(),
    status: OrderStatus.CREATED,
    version: 0,
    ticket: {
      id: new mongoose.Types.ObjectId().toHexString(),
      price: 100,
    },
  };

  // Create a fake message object
  // @ts-ignore
  const fakeMsg: Message = {
    ack: jest.fn(), // Mock ack function
  } as Message;

  return { listener, data: fakeData, msg: fakeMsg };
};

/**
 * Test 1: Ensure the order with given credentials created successfully
 */
it("replicates order data through listener", async () => {
  const { listener, data, msg } = await setup();

  // Call the onMessage function
  await listener.onMessage(data, msg);

  // find the created order
  const order = await Order.findById(data.id);

  // Assert ack was called
  expect(order!.price).toEqual(data.ticket.price);
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
