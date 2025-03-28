import mongoose from "mongoose";
import { TicketCreatedEvent } from "@omidrasticketsapp/common";
import { natsWrapper } from "../../../nats-wrapper";
import { TicketCreatedListener } from "../ticket-created.listener";
import { Message } from "node-nats-streaming";
import { Ticket } from "../../../models/ticket.model";

const setup = async () => {
  // create an instance of a listener
  const listener = new TicketCreatedListener(natsWrapper.client);

  // create a fake data event
  const fakeData: TicketCreatedEvent["data"] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    price: 10,
    title: "test_title",
    userId: new mongoose.Types.ObjectId().toHexString(),
  };

  // create a fake message object
  //   @ts-ignore
  const fakeMsg: Message = {
    ack: jest.fn(),
  };

  return {
    listener,
    data: fakeData,
    msg: fakeMsg,
  };
};

it("creates and saves a ticket", async () => {
  const { listener, data, msg } = await setup();

  // call the onMessage function with the data object + fake message object
  await listener.onMessage(data, msg);

  // write assertions to make sure a ticket was created
  const ticket = await Ticket.findById(data.id);

  expect(ticket).toBeDefined();
  expect(ticket!.title).toEqual(data.title);
  expect(ticket!.price).toEqual(data.price);
});

it("acks the message", async () => {
  const { listener, data, msg } = await setup();

  // call the onMessage function with the data object + fake message object
  await listener.onMessage(data, msg);

  // write assertions to make sure ack function is called
  expect(msg.ack).toHaveBeenCalled();
});
