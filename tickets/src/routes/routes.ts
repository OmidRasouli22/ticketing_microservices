import { Router } from "express";
import {
  extractCurrentUser,
  authenticatedUser,
} from "@omidrasticketsapp/common";
import ticketController from "../controllers/ticket.controller";
import { validateCreateTicket } from "../validations";

const router = Router();

/**
 * @route GET /api/tickets
 * @description Get the list of all tickets
 * @access Public (or authenticated, based on business logic)
 */
router.get("/", ticketController.getTickets);

/**
 * @route GET /api/tickets/:id
 * @description Get one ticket with provided id in the url
 * @access Public (or authenticated, based on business logic)
 */
router.get("/:id", ticketController.getTicket);

/**
 * @route POST /api/tickets
 * @description Create a new ticket
 * @access Private (Authenticated users only)
 */
router.post(
  "/",
  extractCurrentUser,
  authenticatedUser,
  validateCreateTicket,
  ticketController.createTicketHandler
);

/**
 * @route PUT /api/tickets
 * @description Update a ticket
 * @access Private (Authenticated users only)
 */
router.put(
  "/:id",
  extractCurrentUser,
  authenticatedUser,
  validateCreateTicket,
  ticketController.updateTicketHandler
);

export default router;
