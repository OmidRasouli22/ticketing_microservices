import { Ticket } from "../ticket.model";
import mongoose from "mongoose";

it("implements optimistic concurrency control", async () => {
  // Create an instance of a ticket
  const ticket = Ticket.build({
    title: "Concert",
    price: 10,
    userId: new mongoose.Types.ObjectId().toString(),
  });

  // Save the ticket into the database
  await ticket.save();

  // fetch the ticket twice
  const firstInstance = await Ticket.findById(ticket.id);
  const secondInstance = await Ticket.findById(ticket.id);

  // make two separate changes to the tickets we fetched
  firstInstance!.set({ price: 15 });
  secondInstance!.set({ price: 5 });

  // save the first fetched ticket
  await firstInstance!.save();

  // save the second fetched ticket
  // Saving the second fetched ticket should throw an error due to version mismatch
  await expect(secondInstance!.save()).rejects.toThrow();
});

it("increments the version number on multiple saves", async () => {
  // Create an instance of a ticket
  const ticket = Ticket.build({
    title: "Concert",
    price: 10,
    userId: new mongoose.Types.ObjectId().toString(),
  });

  // Save the ticket into the database
  await ticket.save();
  expect(ticket.version).toEqual(0);

  await ticket.save();
  expect(ticket.version).toEqual(1);

  await ticket.save();
  expect(ticket.version).toEqual(2);
});

it("should not throw an error if the same instance is saved multiple times", async () => {
  const ticket = Ticket.build({
    title: "Concert",
    price: 75,
    userId: new mongoose.Types.ObjectId().toString(),
  });

  await ticket.save();
  await expect(ticket.save()).resolves.toBeDefined();
  await expect(ticket.save()).resolves.toBeDefined();
});

it("should handle concurrent saves gracefully", async () => {
  const ticket = Ticket.build({
    title: "Concert",
    price: 100,
    userId: new mongoose.Types.ObjectId().toString(),
  });

  await ticket.save();

  // Simulate multiple concurrent saves
  const firstInstance = await Ticket.findById(ticket.id);
  const secondInstance = await Ticket.findById(ticket.id);

  firstInstance!.set({ price: 150 });
  await firstInstance!.save();

  secondInstance!.set({ price: 200 });
  await expect(secondInstance!.save()).rejects.toThrow(
    mongoose.Error.VersionError
  );

  // Confirm the latest version is in the DB
  const latestTicket = await Ticket.findById(ticket.id);
  expect(latestTicket!.price).toEqual(150);
});
