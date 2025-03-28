import {
  authenticatedUser,
  extractCurrentUser,
  NotFoundError,
  RequestValidationError,
} from "@omidrasticketsapp/common";
import { NextFunction, Request, Response, Router } from "express";
import expressAsyncHandler from "express-async-handler";
import { Order, OrderStatus } from "../models/order.model";
import { param, validationResult } from "express-validator";
import { OrderCancelledPublisher } from "../events/publishers";
import { natsWrapper } from "../nats-wrapper";

const router = Router();

/**
 * Middleware to validate order ID
 */
const validateOrderId = [
  param("id").isMongoId().withMessage("Invalid order ID format"),
];

router.delete(
  "/api/orders/:id",
  extractCurrentUser,
  authenticatedUser,
  expressAsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Handle validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          throw new RequestValidationError(errors.array());
        }
        // Fetch the order
        const order = await Order.findOne({
          userId: req.currentUser.id,
          _id: req.params.id,
        }).populate("ticket");

        // If no order found, throw NotFoundError
        if (!order) {
          throw new NotFoundError();
        }

        // change the status of order
        order.status = OrderStatus.CANCELLED;
        await order.save();

        // publish that order is cancelled
        new OrderCancelledPublisher(natsWrapper.client).publish({
          id: order.id,
          version: order.version,
          ticket: {
            id: order.ticket.id,
          },
        });

        res.status(204).send(order);
      } catch (error) {
        next(error);
      }
    }
  )
);

export default router;
