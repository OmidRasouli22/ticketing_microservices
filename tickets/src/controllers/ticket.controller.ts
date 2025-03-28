import { NextFunction, Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import { Ticket } from "../models";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "@omidrasticketsapp/common";
import { TicketCreatedPublisher, TicketUpdatedPublisher } from "../events";
import { natsWrapper } from "../nats-wrapper";

/**
 * @route GET /api/tickets
 * @description Fetch the list of all tickets
 * @access Public (or authenticated based on business logic)
 */
const getTickets = expressAsyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Retrieve all tickets from the database
      const tickets = await Ticket.find();

      // Return the list of tickets
      res.status(200).json({
        message: "List of all tickets",
        tickets,
      });
    } catch (error) {
      next(error); // Forward error to global error handler
    }
  }
);

/**
 * @route GET /api/tickets/:id
 * @description Fetch one ticket with the given ID
 * @access Public (or authenticated based on business logic)
 */
const getTicket = expressAsyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract the ticket ID from the URL parameters
      const ticketId = req.params.id;

      // Find the ticket by ID
      const ticket = await Ticket.findById(ticketId);

      // Check if the ticket exists
      if (!ticket) {
        throw new NotFoundError();
      }

      // Return the found ticket
      res.status(200).json({
        message: "Ticket fetched successfully",
        ticket,
      });
    } catch (error) {
      next(error); // Forward error to global error handler
    }
  }
);

/**
 * @route POST /api/tickets
 * @description Create a new ticket
 * @access Private (authenticated users only)
 */
const createTicketHandler = expressAsyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Ensure the user is authenticated
      if (!req.currentUser) {
        throw new UnauthorizedError("Unauthorized");
      }

      // Extract and validate the required fields from the request body
      const { title, price } = req.body;

      // Create a new ticket object
      const ticket = new Ticket({
        title,
        price,
        userId: req.currentUser.id,
      });

      // Run both save and publish in parallel
      await Promise.all([
        ticket.save(),
        new TicketCreatedPublisher(natsWrapper.client).publish({
          id: ticket.id,
          title: ticket.title,
          price: ticket.price,
          userId: ticket.userId,
          version: ticket.version,
        }),
      ]);

      // Return success response with the created ticket details
      res.status(201).json({
        message: "Ticket Created Successfully!",
        ticket,
      });
    } catch (error) {
      next(error); // Forward error to global error handler
    }
  }
);

/**
 * @route PUT /api/tickets
 * @description Update a ticket
 * @access Private (authenticated users only)
 */
const updateTicketHandler = expressAsyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract the ticket ID from the URL parameters
      const ticketId = req.params.id;

      // Find the ticket by ID
      const ticket = await Ticket.findById(ticketId);

      // Check if the ticket exists
      if (!ticket) {
        throw new NotFoundError();
      }

      // make sure that ticket is not reserved already
      if (ticket.orderId) {
        throw new BadRequestError("Ticket is not allowed to edited");
      }

      // check if it belongs to authenticated user
      if (ticket.userId !== req.currentUser.id) {
        throw new UnauthorizedError("Not Allowed to update");
      }

      // Extract and validate the required fields from the request body
      const { title, price } = req.body;

      ticket.set({
        title,
        price,
      });
      await ticket.save();

      // publish the event
      new TicketUpdatedPublisher(natsWrapper.client).publish({
        id: ticket.id,
        title: ticket.title,
        price: ticket.price,
        userId: ticket.userId,
        version: ticket.version,
      });

      // Return success response with the created ticket details
      res.status(200).json({
        message: "Ticket Updated Successfully!",
        ticket,
      });
    } catch (error) {
      next(error); // Forward error to global error handler
    }
  }
);

const ticketController = {
  createTicketHandler,
  updateTicketHandler,
  getTickets,
  getTicket,
};

export default ticketController;
