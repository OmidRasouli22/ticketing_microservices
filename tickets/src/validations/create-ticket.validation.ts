import { body } from "express-validator";
import { validateRequest } from "@omidrasticketsapp/common";

// Middleware for validating sign-in (or ticket creation) input
export const validateCreateTicket = validateRequest([
  // Validate "title": it must be a non-empty string.
  body("title")
    .trim() // Remove whitespace from both ends
    .notEmpty()
    .withMessage("Title is required.")
    .isString()
    .withMessage("Title must be a valid string.")
    .isLength({ min: 5, max: 100 })
    .withMessage("Title must be between 5 and 100 characters."),

  // Validate "price": it must be provided and be a numeric value.
  body("price")
    .notEmpty()
    .withMessage("Price is required.")
    .isNumeric()
    .withMessage("Price must be a numeric value.")
    .isFloat({ gt: 0 })
    .withMessage("Price must be a positive number.")
    .custom((value) => {
      if (!/^\d+(\.\d{1,2})?$/.test(value)) {
        throw new Error("Price can have up to two decimal places.");
      }
      return true;
    }),
]);
