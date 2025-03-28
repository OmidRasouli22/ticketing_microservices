import { body } from "express-validator";
import { validateRequest } from "@omidrasticketsapp/common";

export const validateSignin = validateRequest([
  body("email").isEmail().notEmpty().withMessage("Email must be valid"),
  body("password")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Password required"),
]);
