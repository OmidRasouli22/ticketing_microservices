import mongoose from "mongoose";
import app from "./app";

// connect to database
const startApp = async () => {
  console.log("Auth Project Starting Up ...");
  if (!process.env.JWT_SECRET_KEY) {
    throw new Error("Jwt secret missed");
  }
  app.set("trust proxy", true);

  try {
    await mongoose.connect(process.env.MONGODB_URI! as string);
    console.log("MongoDB connected Successfully");
  } catch (error) {
    console.log(`Failed to connect to DB: ${error}`);
  }
  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    console.log("Auth Service is running on Port: " + port);
  });
};

startApp();
