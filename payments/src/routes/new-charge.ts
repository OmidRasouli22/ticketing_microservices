import { Router, Request, Response, NextFunction } from "express";
import expressAsyncHandler from "express-async-handler";
import { createChargeValidation } from "../validations/create-charge.validation";
import { Order } from "../models/order.model";
import {
  BadRequestError,
  NotFoundError,
  OrderStatus,
} from "@omidrasticketsapp/common";
import { stripe } from "../stripe";
import { Payment } from "../models/payment.model";
import { PaymentCreatedPublisher } from "../events";
import { natsWrapper } from "../nats-wrapper";

const router = Router();

router.post(
  "/api/payments",
  createChargeValidation,
  expressAsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { token, orderId } = req.body;

        const order = await Order.findById(orderId);

        // if order not found
        if (!order) throw new NotFoundError();

        // if the order is not belongs to the authenticated user
        if (order.userId !== req.currentUser!.id) {
          throw new BadRequestError("Order is not valid");
        }

        // check that if order is already cancelled or completed somehow
        if (
          order.status === OrderStatus.CANCELLED ||
          order.status === OrderStatus.COMPLETED
        ) {
          throw new BadRequestError("Order is not paymentable anymore.");
        }

        // Process payment
        const charge = await stripe.charges.create({
          currency: process.env.STRIPE_CURRENCY || "usd",
          amount: order.price * 100,
          source: token,
          description: `Payment for order ${order.id}`,
        });

        const payment = Payment.build({
          orderId: order.id,
          userId: req.currentUser!.id,
          chargeId: charge.id,
          amount: charge.amount,
          currency: charge.currency,
        });
        await payment.save();

        // publish the event
        new PaymentCreatedPublisher(natsWrapper.client).publish({
          id: payment.id,
          orderId: order.id,
          userId: req.currentUser!.id,
          chargeId: charge.id,
          amount: charge.amount,
        });

        // Respond with the charge ID
        res.status(201).send(payment);
      } catch (error) {
        next(error);
      }
    }
  )
);

export default router;
