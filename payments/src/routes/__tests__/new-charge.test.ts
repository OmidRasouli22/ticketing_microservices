import request from "supertest";
import app from "../../app";
import mongoose from "mongoose";
import { Order, OrderStatus } from "../../models/order.model";
import { stripe } from "../../stripe";

jest.mock("../../stripe.ts");

it("returns a 404 when purchasing an order that does not exist", async () => {
  await request(app)
    .post("/api/payments")
    .set("Cookie", global.signin())
    .send({
      token: "some_random_token",
      orderId: new mongoose.Types.ObjectId(),
    })
    .expect(404);
});

it("returns a 400 when purchasing an order that does not belongs to the current authenticated user", async () => {
  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    userId: new mongoose.Types.ObjectId().toHexString(),
    price: 100,
    status: OrderStatus.CREATED,
    version: 0,
  });
  await order.save();

  await request(app)
    .post("/api/payments")
    .set("Cookie", global.signin())
    .send({
      token: "some_random_token",
      orderId: order.id,
    })
    .expect(400);
});

it("return 400 when an order is already cancelled or completed", async () => {
  const userId = new mongoose.Types.ObjectId().toHexString();
  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    userId: userId,
    price: 100,
    status: OrderStatus.CANCELLED,
    version: 0,
  });
  await order.save();

  await request(app)
    .post("/api/payments")
    .set("Cookie", global.signin(userId))
    .send({
      token: "some_random_token",
      orderId: order.id,
    })
    .expect(400);
});
