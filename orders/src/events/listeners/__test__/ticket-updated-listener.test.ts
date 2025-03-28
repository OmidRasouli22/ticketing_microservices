import { TicketUpdatedListener } from "../ticket-updated.listener";
import { natsWrapper } from "../../../nats-wrapper";
import { Ticket } from "../../../models/ticket.model";
import mongoose from "mongoose";
import { TicketUpdatedEvent } from "@omidrasticketsapp/common";
import { Message } from "node-nats-streaming";

const setup = async () => {
  // create a listener
  const listener = new TicketUpdatedListener(natsWrapper.client);

  // create and save a ticket
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    price: 10,
    title: "test_title",
  });
  await ticket.save();

  // create a fake data object
  const data: TicketUpdatedEvent["data"] = {
    id: ticket.id,
    version: ticket.version + 1,
    title: "concert",
    price: 10,
    userId: new mongoose.Types.ObjectId().toHexString(),
  };

  // create a fake msg object
  //   @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  // return all these stuff (shit)
  return { listener, data, msg, ticket };
};

it("finds, updates, and saves  a ticket", async () => {
  const { listener, data, msg, ticket } = await setup();
  await listener.onMessage(data, msg);

  const updatedTicket = await Ticket.findById(ticket.id);

  expect(updatedTicket!.title).toEqual(data.title);
  expect(updatedTicket!.price).toEqual(data.price);
  expect(updatedTicket!.version).toEqual(data.version);
});

it("acks the message", async () => {
  const { listener, data, msg, ticket } = await setup();
  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});
