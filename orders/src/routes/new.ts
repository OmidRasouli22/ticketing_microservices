import { NextFunction, Request, Response, Router } from "express";
import expressAsyncHandler from "express-async-handler";
import {
  extractCurrentUser,
  authenticatedUser,
  NotFoundError,
  BadRequestError,
} from "@omidrasticketsapp/common";
import { validateOrder } from "../validations/new-order.validation";
import { Ticket } from "../models/ticket.model";
import { Order, OrderStatus } from "../models/order.model";
import { OrderCreatedPublisher } from "../events/publishers";
import { natsWrapper } from "../nats-wrapper";

const router = Router();

export const EXPIRATION_WINDOW_SECONDS = 60 * 15;

/**
 * Route to create a new order
 * @route POST /api/orders
 * @access Private
 */
router.post(
  "/api/orders",
  extractCurrentUser,
  authenticatedUser,
  validateOrder,
  expressAsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // extract the ticket id that user send in body
        const { ticketId } = req.body;

        // Find the Ticket the authenticated user trying to order in the database
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
          throw new NotFoundError();
        }

        // make sure that this ticket is not already reserverd
        // if a ticket is reserved, that means that it has been associated with an order
        // and the order document itself must not have a status of cancelled
        // Run Query to look at all orders. Find an order  where the ticketId property is the ticket
        // we just found *and* the order status is *not* cancelled.
        // If we find an order with saying criteria that means that the ticket *is* reserved.
        const isReserved = await ticket.isReserved();
        if (isReserved) {
          throw new BadRequestError("Ticket is already reserved.");
        }

        // calculate the expiration date for this order
        const expiration = new Date();
        expiration.setSeconds(
          expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS
        );

        // build the order and save it to the database
        const order = Order.build({
          userId: req.currentUser.id,
          status: OrderStatus.CREATED,
          expiresAt: expiration,
          ticket,
        });
        await order.save();

        // notify other services that need this order data => publish event
        new OrderCreatedPublisher(natsWrapper.client).publish({
          id: order.id,
          status: order.status,
          userId: order.userId,
          version: order.version,
          expiresAt: order.expiresAt.toISOString(),
          ticket: {
            id: order.ticket.id,
            price: order.ticket.price,
          },
        });

        // return response
        res.status(201).json(order);
      } catch (error: any) {
        console.log("Error Occurred on creating new order: " + error.message);
        next(error);
      }
    }
  )
);

export default router;
