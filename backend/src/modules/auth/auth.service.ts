import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/app-error.js";
import { durationToMilliseconds } from "../../shared/utils/duration.js";
import { userRepository, type UserEntity } from "../users/user.repository.js";
import { authRepository } from "./auth.repository.js";
import type { AccessTokenPayload, AuthSession, AuthUserDto, RefreshTokenPayload } from "./auth.types.js";
import type { LoginRequestBody, RegisterRequestBody } from "./auth.validation.js";

const passwordSaltRounds = 12;

export class AuthService {
  public async register(input: RegisterRequestBody): Promise<AuthSession> {
    const existingUser = await userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new AppError("EMAIL_ALREADY_REGISTERED", "Email is already registered", 409);
    }

    const passwordHash = await bcrypt.hash(input.password, passwordSaltRounds);
    const user = await userRepository.create({
      email: input.email,
      passwordHash,
      displayName: input.displayName
    });

    return this.createSession(user);
  }

  public async login(input: LoginRequestBody): Promise<AuthSession> {
    const user = await userRepository.findByEmail(input.email);

    if (!user) {
      throw new AppError("INVALID_CREDENTIALS", "Invalid email or password", 401);
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new AppError("INVALID_CREDENTIALS", "Invalid email or password", 401);
    }

    return this.createSession(user);
  }

  public async refresh(refreshToken: string): Promise<AuthSession> {
    const payload = this.verifyRefreshToken(refreshToken);
    const tokenHash = await this.hashRefreshToken(refreshToken);
    const persistedToken = await authRepository.findActiveRefreshToken(tokenHash);

    if (!persistedToken || persistedToken.id !== payload.tokenId) {
      throw new AppError("INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired", 401);
    }

    await authRepository.revokeRefreshToken(tokenHash);

    const user = await userRepository.findById(payload.sub);

    if (!user) {
      throw new AppError("INVALID_REFRESH_TOKEN", "Refresh token user no longer exists", 401);
    }

    return this.createSession(user);
  }

  public async logout(refreshToken: string): Promise<void> {
    const tokenHash = await this.hashRefreshToken(refreshToken);
    await authRepository.revokeRefreshToken(tokenHash);
  }

  public async getUserFromAccessToken(accessToken: string): Promise<AuthUserDto> {
    const payload = this.verifyAccessToken(accessToken);
    const user = await userRepository.findById(payload.sub);

    if (!user) {
      throw new AppError("AUTHENTICATION_REQUIRED", "Authentication required", 401);
    }

    return this.toUserDto(user);
  }

  private async createSession(user: UserEntity): Promise<AuthSession> {
    const userDto = this.toUserDto(user);
    const accessToken = this.signAccessToken(userDto);
    const refreshTokenRecord = await authRepository.createRefreshToken({
      userId: userDto.id,
      tokenHash: "pending",
      expiresAt: new Date(Date.now() + durationToMilliseconds(env.REFRESH_TOKEN_TTL))
    });

    const refreshToken = this.signRefreshToken(userDto.id, refreshTokenRecord.id);
    const tokenHash = await this.hashRefreshToken(refreshToken);
    refreshTokenRecord.tokenHash = tokenHash;
    await refreshTokenRecord.save();

    return {
      user: userDto,
      accessToken,
      refreshToken
    };
  }

  private toUserDto(user: UserEntity): AuthUserDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName
    };
  }

  private signAccessToken(user: AuthUserDto): string {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      displayName: user.displayName
    };

    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"]
    });
  }

  private signRefreshToken(userId: string, tokenId: string): string {
    const payload: RefreshTokenPayload = {
      sub: userId,
      tokenId
    };

    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.REFRESH_TOKEN_TTL as SignOptions["expiresIn"]
    });
  }

  private verifyAccessToken(accessToken: string): AccessTokenPayload {
    try {
      const payload = jwt.verify(accessToken, env.JWT_ACCESS_SECRET);

      if (!this.isAccessTokenPayload(payload)) {
        throw new AppError("INVALID_ACCESS_TOKEN", "Access token is invalid", 401);
      }

      return payload;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError("INVALID_ACCESS_TOKEN", "Access token is invalid or expired", 401);
    }
  }

  private verifyRefreshToken(refreshToken: string): RefreshTokenPayload {
    try {
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);

      if (!this.isRefreshTokenPayload(payload)) {
        throw new AppError("INVALID_REFRESH_TOKEN", "Refresh token is invalid", 401);
      }

      return payload;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError("INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired", 401);
    }
  }

  private isAccessTokenPayload(payload: unknown): payload is AccessTokenPayload {
    return (
      typeof payload === "object" &&
      payload !== null &&
      "sub" in payload &&
      "email" in payload &&
      "displayName" in payload &&
      typeof payload.sub === "string" &&
      typeof payload.email === "string" &&
      typeof payload.displayName === "string"
    );
  }

  private isRefreshTokenPayload(payload: unknown): payload is RefreshTokenPayload {
    return (
      typeof payload === "object" &&
      payload !== null &&
      "sub" in payload &&
      "tokenId" in payload &&
      typeof payload.sub === "string" &&
      typeof payload.tokenId === "string"
    );
  }

  private hashRefreshToken(refreshToken: string) {
    return crypto.createHmac("sha256", env.JWT_REFRESH_SECRET).update(refreshToken).digest("hex");
  }
}

export const authService = new AuthService();
