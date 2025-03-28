import express, { NextFunction, Request, Response } from "express";
import "express-async-errors"; // Ensure this is imported
import bodyParser from "body-parser";
import cookieSession from "cookie-session";
import {
  authenticatedUser,
  errorHandler,
  extractCurrentUser,
  NotFoundError,
} from "@omidrasticketsapp/common";
import newChargeRoute from "./routes/new-charge";

const app = express();

app.use(bodyParser.json());

app.use(
  cookieSession({
    signed: false,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  })
);

app.use(extractCurrentUser, authenticatedUser);
app.use(newChargeRoute);

// Catch-all route to handle 404 errors
app.use("*", async (req: Request, res: Response) => {
  throw new NotFoundError();
});

// Apply the error handler as the last middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  errorHandler(err, req, res, next);
}); // This should be the last middleware

export default app;
