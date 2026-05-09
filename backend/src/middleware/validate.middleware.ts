import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export const validateBody =
  <TBody>(schema: ZodSchema<TBody>) =>
  (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.parse(request.body);
    request.body = result;
    next();
  };
