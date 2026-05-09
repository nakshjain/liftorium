import { Types } from "mongoose";
import { RefreshTokenModel } from "./refresh-token.model.js";

export type CreateRefreshTokenInput = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export class AuthRepository {
  public async createRefreshToken(input: CreateRefreshTokenInput) {
    return RefreshTokenModel.create({
      userId: new Types.ObjectId(input.userId),
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt
    });
  }

  public async findActiveRefreshToken(tokenHash: string) {
    return RefreshTokenModel.findOne({
      tokenHash,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() }
    }).exec();
  }

  public async revokeRefreshToken(tokenHash: string) {
    await RefreshTokenModel.updateOne(
      {
        tokenHash,
        revokedAt: { $exists: false }
      },
      {
        $set: {
          revokedAt: new Date()
        }
      }
    ).exec();
  }

  public async revokeAllUserRefreshTokens(userId: string) {
    await RefreshTokenModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        revokedAt: { $exists: false }
      },
      {
        $set: {
          revokedAt: new Date()
        }
      }
    ).exec();
  }
}

export const authRepository = new AuthRepository();
