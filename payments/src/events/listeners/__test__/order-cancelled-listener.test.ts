import { natsWrapper } from "../../../nats-wrapper";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { OrderCancelledEvent, OrderStatus } from "@omidrasticketsapp/common";
import { Message } from "node-nats-streaming";
import { OrderCancelledListener } from "../order-cancelled-listener";
import { Order } from "../../../models/order.model";

/**
 * Setup function to initialize the listener, ticket, event data, and message.
 */
const setup = async () => {
  const listener = new OrderCancelledListener(natsWrapper.client);

  // Create a ticket with an orderId (reserved state)
  const orderId = new mongoose.Types.ObjectId().toHexString();
  const order = Order.build({
    id: orderId,
    status: OrderStatus.CREATED,
    price: 10,
    userId: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
  });
  await order.save();

  // Create fake OrderCancelledEvent data
  const fakeData: OrderCancelledEvent["data"] = {
    id: order.id,
    version: order.version + 1, // Simulate version increment
    ticket: {
      id: new mongoose.Types.ObjectId().toHexString(),
    },
  };

  // Create a fake message object
  // @ts-ignore
  const fakeMsg: Message = {
    ack: jest.fn(), // Mock ack function
  } as Message;

  return { listener, data: fakeData, msg: fakeMsg, order };
};

/**
 * Test 1: Cancel the order successfully
 */
it("cancel the order", async () => {
  const { listener, data, msg, order } = await setup();
  await listener.onMessage(data, msg);
  const updatedOrder = await Order.findById(order.id);
  expect(updatedOrder!.status).toEqual(OrderStatus.CANCELLED);
  expect(updatedOrder!.version).toEqual(order.version + 1);
  expect(msg.ack).toHaveBeenCalled();
});
