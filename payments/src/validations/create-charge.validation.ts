import { body } from "express-validator";
import { validateRequest } from "@omidrasticketsapp/common";

export const createChargeValidation = validateRequest([
  body("token").isString().notEmpty().withMessage("Token must be valid"),
  body("orderId")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("OrderId is required"),
]);
