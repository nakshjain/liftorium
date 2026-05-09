import type { Request, Response } from "express";
import { env, isProduction } from "../../config/env.js";
import { AppError } from "../../shared/errors/app-error.js";
import { authService } from "./auth.service.js";
import type { AuthSession } from "./auth.types.js";
import type { LoginRequestBody, RegisterRequestBody } from "./auth.validation.js";

const refreshTokenCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: isProduction,
  path: "/api/v1/auth"
};

export class AuthController {
  public async register(request: Request<object, object, RegisterRequestBody>, response: Response) {
    const session = await authService.register(request.body);
    this.sendSession(response, session, 201);
  }

  public async login(request: Request<object, object, LoginRequestBody>, response: Response) {
    const session = await authService.login(request.body);
    this.sendSession(response, session, 200);
  }

  public async refresh(request: Request, response: Response) {
    const refreshToken = this.getRefreshTokenFromCookie(request);
    const session = await authService.refresh(refreshToken);
    this.sendSession(response, session, 200);
  }

  public async me(request: Request, response: Response) {
    const authorizationHeader = request.header("authorization");
    const accessToken = authorizationHeader?.startsWith("Bearer ")
      ? authorizationHeader.slice("Bearer ".length)
      : "";
    const user = await authService.getUserFromAccessToken(accessToken);

    response.status(200).json({
      success: true,
      data: {
        user
      }
    });
  }

  public async logout(request: Request, response: Response) {
    const refreshToken = this.getRefreshTokenFromCookie(request);
    await authService.logout(refreshToken);

    response.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME, refreshTokenCookieOptions);
    response.status(200).json({
      success: true,
      data: {
        loggedOut: true
      }
    });
  }

  private sendSession(
    response: Response,
    session: AuthSession,
    statusCode: number
  ) {
    response.cookie(env.REFRESH_TOKEN_COOKIE_NAME, session.refreshToken, refreshTokenCookieOptions);
    response.status(statusCode).json({
      success: true,
      data: {
        user: session.user,
        accessToken: session.accessToken
      }
    });
  }

  private getRefreshTokenFromCookie(request: Request) {
    const refreshToken = request.cookies[env.REFRESH_TOKEN_COOKIE_NAME];

    if (typeof refreshToken !== "string" || refreshToken.length === 0) {
      throw new AppError("REFRESH_TOKEN_REQUIRED", "Refresh token cookie is missing", 401);
    }

    return refreshToken;
  }
}

export const authController = new AuthController();
