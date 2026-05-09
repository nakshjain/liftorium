import type { NextFunction, Request, Response } from "express";
import { authService } from "../modules/auth/auth.service.js";
import { AppError } from "../shared/errors/app-error.js";

export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName: string;
};

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

export const authMiddleware = async (request: Request, _response: Response, next: NextFunction) => {
  try {
    const authorizationHeader = request.header("authorization");

    if (!authorizationHeader?.startsWith("Bearer ")) {
      throw new AppError("AUTHENTICATION_REQUIRED", "Authentication required", 401);
    }

    const accessToken = authorizationHeader.slice("Bearer ".length);
    const user = await authService.getUserFromAccessToken(accessToken);

    request.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
