import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { exerciseRoutes } from "./modules/exercises/exercise.routes.js";
import { notFoundHandler } from "./shared/http/not-found.handler.js";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_request, response) => {
    response.status(200).json({
      success: true,
      data: {
        status: "ok"
      }
    });
  });

  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/exercises", exerciseRoutes);
  app.use(notFoundHandler);
  app.use(errorMiddleware);

  return app;
};
