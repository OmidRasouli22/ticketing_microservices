import express, { NextFunction, Request, Response } from "express";
import "express-async-errors"; // Ensure this is imported
import bodyParser from "body-parser";
import cookieSession from "cookie-session";
import pinoHttp from "pino-http";
import logger from "./logger"; // import the logger we created
import { errorHandler, NotFoundError } from "@omidrasticketsapp/common";

import deleteOrderRouter from "./routes/delete";
import indexOrderRouter from "./routes/index";
import showOrderRouter from "./routes/show";
import newOrderRouter from "./routes/new";

const app = express();

app.use(bodyParser.json());
app.use(pinoHttp({ logger }));

app.use(
  cookieSession({
    signed: false,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  })
);

app.use(indexOrderRouter);
app.use(showOrderRouter);
app.use(newOrderRouter);
app.use(deleteOrderRouter);

// Catch-all route to handle 404 errors
app.use("*", async (req: Request, res: Response) => {
  throw new NotFoundError();
});

// Apply the error handler as the last middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  errorHandler(err, req, res, next);
}); // This should be the last middleware

export default app;
