import type { HydratedDocument } from "mongoose";
import { UserModel, type UserDocument } from "./user.model.js";

export type UserEntity = HydratedDocument<UserDocument>;

export type CreateUserInput = {
  email: string;
  passwordHash: string;
  displayName: string;
};

export class UserRepository {
  public async create(input: CreateUserInput) {
    return UserModel.create(input);
  }

  public async findByEmail(email: string) {
    return UserModel.findOne({ email: email.toLowerCase() }).exec();
  }

  public async findById(userId: string) {
    return UserModel.findById(userId).exec();
  }
}

export const userRepository = new UserRepository();
