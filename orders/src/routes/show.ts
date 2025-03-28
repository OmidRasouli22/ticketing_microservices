import { NextFunction, Request, Response, Router } from "express";
import {
  extractCurrentUser,
  authenticatedUser,
  NotFoundError,
  RequestValidationError,
} from "@omidrasticketsapp/common";
import expressAsyncHandler from "express-async-handler";
import { param, validationResult } from "express-validator";
import { Order } from "../models/order.model";

const router = Router();

/**
 * Middleware to validate order ID
 */
const validateOrderId = [
  param("id").isMongoId().withMessage("Invalid order ID format"),
];

/**
 * Route: GET /api/orders/:id
 * Description: Fetch a specific order by ID for the authenticated user.
 */
router.get(
  "/api/orders/:id",
  extractCurrentUser,
  authenticatedUser,
  validateOrderId,
  expressAsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
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

      // Respond with the order
      res.status(200).send(order);
    }
  )
);

export default router;
