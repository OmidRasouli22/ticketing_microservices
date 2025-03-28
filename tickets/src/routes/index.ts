import { Router } from "express";
import routes from "./routes";

const router = Router();

router.use("/api/tickets", routes);

export default router;
