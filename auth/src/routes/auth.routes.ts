import { NextFunction, Request, Response, Router } from "express";
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import { validateSignup, validateSignin } from "../validations";
import {
  BadRequestError,
  authenticatedUser,
  extractCurrentUser,
} from "@omidrasticketsapp/common";
import { User } from "../models";

const router = Router();

// ✅ Get Current User
router.get(
  "/current-user",
  extractCurrentUser,
  authenticatedUser,
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json({
      message: "Current logged in user",
      user: req.currentUser,
    });
  })
);

// ✅ Sign In
router.post(
  "/signin",
  validateSignin,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new BadRequestError("Invalid Credentials");

    // ✅ 2. Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new BadRequestError("Invalid credentials");
    }
    // ✅ 3. Generate JWT Token
    const userJwt = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET_KEY as string,
      { expiresIn: "15m" }
    );

    // ✅ 4. Store token in session
    req.session = { jwt: userJwt };

    res.status(200).json({
      message: "Sign-in successful",
      user,
    });
  })
);

// ✅ Sign Out
router.post(
  "/signout",
  extractCurrentUser,
  authenticatedUser,
  asyncHandler(async (req: Request, res: Response) => {
    req.session = null;
    res.status(200).json({
      message: "User Logged out successfully",
    });
  })
);

// ✅ Sign Up
router.post(
  "/signup",
  validateSignup,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new BadRequestError("Email is already taken!");
    }

    const user = User.build({ email, password });
    await user.save();

    const userJwt = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET_KEY as string,
      {
        expiresIn: "15m",
      }
    );

    req.session = {
      jwt: userJwt,
    };

    res.status(201).json({
      message: "User created successfully",
      user,
    });
  })
);

export default router;
