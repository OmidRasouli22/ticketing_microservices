import { NextFunction, Request, Response, Router } from "express";
import {
  extractCurrentUser,
  authenticatedUser,
} from "@omidrasticketsapp/common";
import expressAsyncHandler from "express-async-handler";
import { Order } from "../models/order.model";

const router = Router();

router.get(
  "/api/orders",
  extractCurrentUser,
  authenticatedUser,
  expressAsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const orders = await Order.find({
          userId: req.currentUser.id,
        }).populate("ticket");
        res.send(orders);
      } catch (error: any) {
        console.log("Error Fetching User Orders: " + error.message);
        next(error);
      }
    }
  )
);

export default router;
