import mongoose from "mongoose";
import { Ticket } from "../../../models/ticket.model";
import { natsWrapper } from "../../../nats-wrapper";
import { ExpirationCompleteListener } from "../expiration-complete.listener";
import { Order, OrderStatus } from "../../../models/order.model";
import { ExpirationCompleteEvent } from "@omidrasticketsapp/common";
import { Message } from "node-nats-streaming";

const setup = async () => {
  const listener = new ExpirationCompleteListener(natsWrapper.client);

  // create and save a ticket
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    price: 10,
    title: "test_title",
  });
  await ticket.save();

  const order = Order.build({
    expiresAt: new Date(),
    ticket,
    status: OrderStatus.CREATED,
    userId: new mongoose.Types.ObjectId().toHexString(),
  });
  await order.save();

  const data: ExpirationCompleteEvent["data"] = {
    orderId: order.id,
  };

  //   @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { ticket, order, data, msg, listener };
};

it("updates the order status to cancelled", async () => {
  const { data, listener, ticket, order, msg } = await setup();
  await listener.onMessage(data, msg);

  const updatedOrder = await Order.findById(order.id);
  expect(updatedOrder!.status).toEqual(OrderStatus.CANCELLED);
});

it("emits an orderCancelled event", async () => {
  const { data, listener, ticket, order, msg } = await setup();
  await listener.onMessage(data, msg);

  expect(natsWrapper.client.publish).toHaveBeenCalled();

  const eventData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  );
  expect(eventData.id).toEqual(order.id);
});

it("acks the message", async () => {
  const { data, listener, ticket, order, msg } = await setup();
  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});
