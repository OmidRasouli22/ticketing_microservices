import mongoose from "mongoose";
import { body } from "express-validator";
import { validateRequest } from "@omidrasticketsapp/common";

export const validateOrder = validateRequest([
  body("ticketId")
    .trim() // Remove whitespace from both ends
    .notEmpty()
    .withMessage("Ticket id is required.")
    .isString()
    .withMessage("Ticket id must be a valid string.")
    .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
    .withMessage("Invalid Ticket id provided"),
]);
