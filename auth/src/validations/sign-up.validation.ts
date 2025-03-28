import { body } from "express-validator";
import { validateRequest } from "@omidrasticketsapp/common";

export const validateSignup = validateRequest([
  body("email").isEmail().notEmpty().withMessage("Email must be valid"),
  body("password")
    .isString()
    .trim()
    .isLength({ min: 6, max: 20 })
    .withMessage("Password must be between 6 and 20 characters"),
]);
