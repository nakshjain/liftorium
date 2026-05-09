import { Router } from "express";
import { validateBody } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { authController } from "./auth.controller.js";
import { loginSchema, registerSchema } from "./auth.validation.js";

export const authRoutes = Router();

authRoutes.post("/register", validateBody(registerSchema), asyncHandler(authController.register.bind(authController)));
authRoutes.post("/login", validateBody(loginSchema), asyncHandler(authController.login.bind(authController)));
authRoutes.post("/refresh", asyncHandler(authController.refresh.bind(authController)));
authRoutes.get("/me", asyncHandler(authController.me.bind(authController)));
authRoutes.post("/logout", asyncHandler(authController.logout.bind(authController)));
