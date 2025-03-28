import { Router } from "express";
import userRoutes from "./auth.routes";

const router = Router();

router.use("/api/users", userRoutes);

export default router;
